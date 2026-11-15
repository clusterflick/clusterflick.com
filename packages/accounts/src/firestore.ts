import { UpstreamError } from "./google-auth";

/**
 * Firestore's REST API, as a Worker reads and writes it with a service
 * account's token: no SDK, which needs Node. The Admin SDK skips the security
 * rules, and so does this, so a Worker reads only what it was asked for,
 * writes only what it owns, and checks what it puts in a path.
 */

/**
 * A Firebase uid as the site's rules let one into a document path. Anything
 * else read from a token, a document or a request isn't put in a path.
 */
export function isUid(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9]{1,128}$/.test(value);
}

/** A Firestore REST value: one key naming its type, holding the value. */
export type Value = Record<string, unknown>;
export type Fields = Record<string, Value>;
type Document = { name: string; fields?: Fields; updateTime?: string };

export type DocumentData = Record<string, unknown>;

/**
 * A REST value as the JavaScript SDK would read it. Integers come as strings
 * (they may be 64-bit); every number the site stores fits a double.
 */
export function decodeValue(value: Value): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("mapValue" in value) {
    const { fields } = value.mapValue as { fields?: Fields };
    return decodeFields(fields);
  }
  if ("arrayValue" in value) {
    const { values } = value.arrayValue as { values?: Value[] };
    return (values ?? []).map(decodeValue);
  }
  // References, geo points and bytes: nothing the site stores.
  return undefined;
}

export function decodeFields(fields: Fields = {}): DocumentData {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]),
  );
}

/**
 * A plain value as a REST value, as the JavaScript SDK would store it: whole
 * numbers as integers, others as doubles. `undefined` is refused rather than
 * dropped, as the SDK refuses it: a field left out by mistake shouldn't
 * write.
 */
export function encodeValue(value: unknown): Value {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`Can't store ${value}`);
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
  if (typeof value === "object") {
    return { mapValue: { fields: encodeFields(value as DocumentData) } };
  }
  throw new TypeError(`Can't store a ${typeof value}`);
}

export function encodeFields(data: DocumentData): Fields {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, encodeValue(value)]),
  );
}

/** A document as read, with the time it was last written, for a precondition. */
export type VersionedDocument = { data: DocumentData; updateTime: string };

/**
 * What a write needs to be true of the document as it stands, or the whole
 * commit is refused with a `PreconditionError`: that it was last written at
 * `updateTime` (unchanged since it was read), or that it `exists` or doesn't.
 */
export type Precondition = { updateTime: string } | { exists: boolean };

/** One write in a `commit`, all of which land or none do. */
export type Write =
  /** Replace the document with `data`, creating it if need be. */
  | { set: string; data: DocumentData; precondition?: Precondition }
  /**
   * Write only the top-level `fields` named, from `data`, leaving the rest;
   * a field named but absent from `data` is removed. Creates the document
   * unless the precondition says it must exist.
   */
  | {
      update: string;
      data: DocumentData;
      fields: string[];
      precondition?: Precondition;
    }
  | { delete: string; precondition?: Precondition };

/**
 * A commit refused because a precondition failed: the document changed
 * since it was read, or was or wasn't there. Read it again and decide again.
 */
export class PreconditionError extends UpstreamError {}

/** A field path as REST takes one: a name that isn't plain is backquoted. */
const fieldPath = (name: string) =>
  /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
    ? name
    : `\`${name.replace(/[\\`]/g, "\\$&")}\``;

export class Firestore {
  readonly root: string;

  constructor(
    projectId: string,
    private readonly getToken: () => Promise<string>,
  ) {
    this.root = `projects/${projectId}/databases/(default)/documents`;
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${await this.getToken()}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response;
  }

  /** One document, or null if there is none. */
  async get(path: string): Promise<DocumentData | null> {
    const response = await this.request(`${this.root}/${path}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new UpstreamError(
        `Firestore get failed: ${response.status} ${await response.text()}`,
      );
    }
    return decodeFields(((await response.json()) as Document).fields);
  }

  /**
   * One document with the time it was last written, for a `commit` that
   * must find it unchanged; null if there is none.
   */
  async getVersioned(path: string): Promise<VersionedDocument | null> {
    const response = await this.request(`${this.root}/${path}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new UpstreamError(
        `Firestore get failed: ${response.status} ${await response.text()}`,
      );
    }
    const document = (await response.json()) as Document;
    if (!document.updateTime) {
      throw new UpstreamError(`Firestore sent ${path} with no updateTime`);
    }
    return {
      data: decodeFields(document.fields),
      updateTime: document.updateTime,
    };
  }

  /**
   * Writes, all at once or not at all. Throws `PreconditionError` when a
   * precondition fails, so the caller can read again and retry, and
   * `UpstreamError` for anything else.
   */
  async commit(writes: Write[]): Promise<void> {
    const body = {
      writes: writes.map((write) => {
        const currentDocument = write.precondition && {
          currentDocument: write.precondition,
        };
        if ("delete" in write) {
          return { delete: `${this.root}/${write.delete}`, ...currentDocument };
        }
        const path = "set" in write ? write.set : write.update;
        const fields =
          "set" in write
            ? encodeFields(write.data)
            : encodeFields(
                Object.fromEntries(
                  write.fields
                    .filter((name) => name in write.data)
                    .map((name) => [name, write.data[name]]),
                ),
              );
        return {
          update: { name: `${this.root}/${path}`, fields },
          ...("update" in write && {
            updateMask: { fieldPaths: write.fields.map(fieldPath) },
          }),
          ...currentDocument,
        };
      }),
    };
    const response = await this.request(`${this.root}:commit`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (response.ok) return;
    const text = await response.text();
    // A failed precondition is FAILED_PRECONDITION; a write racing another
    // on the same document can be ABORTED. Either way, read again.
    if (/FAILED_PRECONDITION|ABORTED/.test(text)) {
      throw new PreconditionError(`Firestore commit refused: ${text}`);
    }
    throw new UpstreamError(
      `Firestore commit failed: ${response.status} ${text}`,
    );
  }

  /**
   * Every document in any collection named `collectionId`, at any depth,
   * whose `field` equals `value`: `meta` documents with `enabled: true`,
   * say. Needs a collection-group index on the field
   * (`firestore.indexes.json`). Each comes with its path, from the root.
   */
  async findInCollectionGroup(
    collectionId: string,
    field: string,
    value: unknown,
  ): Promise<{ path: string; data: DocumentData }[]> {
    const response = await this.request(`${this.root}:runQuery`, {
      method: "POST",
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId, allDescendants: true }],
          where: {
            fieldFilter: {
              field: { fieldPath: fieldPath(field) },
              op: "EQUAL",
              value: encodeValue(value),
            },
          },
        },
      }),
    });
    if (!response.ok) {
      throw new UpstreamError(
        `Firestore query failed: ${response.status} ${await response.text()}`,
      );
    }
    // One entry per document, and one with no document when there are none.
    const results = (await response.json()) as { document?: Document }[];
    const prefix = `${this.root}/`;
    return results.flatMap(({ document }) =>
      document
        ? [
            {
              path: document.name.slice(prefix.length),
              data: decodeFields(document.fields),
            },
          ]
        : [],
    );
  }

  /**
   * `batchGet`'s answer as Firestore sent it, undecoded: a JSON array of
   * `{ found: Document }` or `{ missing: name }`, in no particular order.
   */
  async batchGetText(paths: string[], fields: string[]): Promise<string> {
    const names = paths.map((path) => `${this.root}/${path}`);
    const response = await this.request(`${this.root}:batchGet`, {
      method: "POST",
      body: JSON.stringify({ documents: names, mask: { fieldPaths: fields } }),
    });
    if (!response.ok) {
      throw new UpstreamError(
        `Firestore batchGet failed: ${response.status} ${await response.text()}`,
      );
    }
    return response.text();
  }

  /**
   * Several documents in one request, by path, each null if it doesn't exist.
   * Firestore takes one field mask for the whole batch, so `fields` is the
   * union of what each document needs; a field one of them doesn't have is
   * simply absent. The fields come back undecoded, for the caller to decode
   * what it uses.
   */
  async batchGet(
    paths: string[],
    fields: string[],
  ): Promise<(Fields | null)[]> {
    const names = paths.map((path) => `${this.root}/${path}`);
    // In no particular order, so matched up by name.
    const results = JSON.parse(await this.batchGetText(paths, fields)) as {
      found?: Document;
      missing?: string;
    }[];
    const byName = new Map<string, Fields | null>();
    for (const result of results) {
      if (result.found) {
        byName.set(result.found.name, result.found.fields ?? {});
      } else if (result.missing) {
        byName.set(result.missing, null);
      }
    }
    return names.map((name) => {
      if (!byName.has(name)) {
        throw new UpstreamError(`Firestore batchGet left out ${name}`);
      }
      return byName.get(name)!;
    });
  }
}
