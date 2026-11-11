import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { RESERVED_HANDLES } from "@/lib/user-profile";

// The rules can't import the module, so they keep their own copy of the
// handle checks. These hold it to the module's.
describe("the rules' copy of the handle checks", () => {
  const rules = readFileSync(
    path.join(import.meta.dirname, "..", "firestore.rules"),
    "utf8",
  );
  const body = rules.match(/function isClaimableHandle[\s\S]*?\n {2}\}/)?.[0];

  test("has the same reserved handles", () => {
    const list = body?.match(/handle in \[([\s\S]*?)\]/)?.[1];
    const reserved = [...(list ?? "").matchAll(/'([^']+)'/g)].map(
      ([, handle]) => handle,
    );
    expect(reserved.sort()).toEqual([...RESERVED_HANDLES].sort());
  });

  test("has the same pattern and lengths", () => {
    expect(body).toContain("handle.matches('^[a-z0-9_-]{3,30}$')");
  });
});
