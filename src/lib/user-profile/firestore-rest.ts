/**
 * Firestore's REST format, as the profiles Worker passes it on: each value an
 * object with one key naming its type. The Worker doesn't decode the lists
 * itself, to stay inside its CPU limit, so the page does, here.
 */
type Value = Record<string, unknown>;
type Fields = Record<string, Value>;

/** A REST value as the JavaScript SDK would read it. */
export function decodeValue(value: Value): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  // Integers come as strings (they may be 64-bit); every number the site
  // stores fits a double.
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("mapValue" in value) {
    const { fields } = (value.mapValue ?? {}) as { fields?: Fields };
    return decodeFields(fields);
  }
  if ("arrayValue" in value) {
    const { values } = (value.arrayValue ?? {}) as { values?: Value[] };
    return (values ?? []).map(decodeValue);
  }
  // References, geo points and bytes: nothing the site stores.
  return undefined;
}

export function decodeFields(fields: Fields = {}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]),
  );
}

/**
 * A `batchGet` answer's documents, decoded, by the last two parts of their
 * names (`users/-`, `meta/films`). A missing document is left out.
 */
export function decodeBatchGet(
  results: unknown,
): Record<string, Record<string, unknown>> {
  if (!Array.isArray(results)) return {};
  return Object.fromEntries(
    results.flatMap((result) => {
      const found = (result as { found?: { name?: unknown; fields?: Fields } })
        ?.found;
      if (typeof found?.name !== "string") return [];
      const key = found.name.split("/").slice(-2).join("/");
      return [[key, decodeFields(found.fields)]];
    }),
  );
}
