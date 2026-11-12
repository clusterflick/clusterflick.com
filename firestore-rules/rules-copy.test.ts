import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { PROFILE_SECTION_IDS, RESERVED_HANDLES } from "@/lib/user-profile";

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

describe("the rules' copy of the profile sections", () => {
  const rules = readFileSync(
    path.join(import.meta.dirname, "..", "firestore.rules"),
    "utf8",
  );
  const body = rules.match(/function isProfileSections[\s\S]*?\n {2}\}/)?.[0];
  const sorted = [...PROFILE_SECTION_IDS].sort();
  const listed = (method: string) =>
    [
      ...(
        body?.match(new RegExp(`keys\\(\\)\\.${method}\\(\\[(.*?)\\]`))?.[1] ??
        ""
      ).matchAll(/'([^']+)'/g),
    ]
      .map(([, id]) => id)
      .sort();

  test("allows exactly the module's sections, and requires them all", () => {
    expect(listed("hasOnly")).toEqual(sorted);
    expect(listed("hasAll")).toEqual(sorted);
  });

  test("requires each to be a boolean", () => {
    for (const id of sorted) expect(body).toContain(`sections.${id} is bool`);
  });
});
