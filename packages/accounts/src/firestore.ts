import { UpstreamError } from "./google-auth";

/**
 * Firestore's REST API, as a Worker reads it with a service account's token:
 * no SDK, which needs Node. The Admin SDK skips the security rules, and so
 * does this, so a Worker reads only what it was asked for and checks what it
 * puts in a path.
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
type Document = { name: string; fields?: Fields };

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
