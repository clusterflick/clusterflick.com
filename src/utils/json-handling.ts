export function safelyJsonStringify<T>(value: T): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

export function safelyJsonParse<T>(value: string): T | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
