import { describe, it, expect } from "vitest";
import robots from "./robots";

// Google's reading of a robots.txt path rule: a prefix match, where `*`
// matches any run of characters and a trailing `$` anchors the end.
function matchesRule(path: string, rule: string): boolean {
  const anchored = rule.endsWith("$");
  const pattern = (anchored ? rule.slice(0, -1) : rule)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${pattern}${anchored ? "$" : ""}`).test(path);
}

function isDisallowed(path: string): boolean {
  const { rules } = robots();
  const rule = Array.isArray(rules) ? rules[0] : rules;
  const disallow = [rule.disallow ?? []].flat();
  return disallow.some((entry) => matchesRule(path, entry));
}

describe("robots", () => {
  it("blocks addresses with a query string", () => {
    expect(isDisallowed("/catalogue/?letterboxd=4.0")).toBe(true);
    expect(isDisallowed("/catalogue?base=all&genres=28")).toBe(true);
    expect(isDisallowed("/movies/100/heat/?base=all&venues=bfi")).toBe(true);
    expect(isDisallowed("/planner/?day=2026-11-18&view=grid")).toBe(true);
  });

  it("leaves the pages themselves crawlable", () => {
    expect(isDisallowed("/")).toBe(false);
    expect(isDisallowed("/catalogue/")).toBe(false);
    expect(isDisallowed("/movies/100/heat/")).toBe(false);
    expect(isDisallowed("/venues/prince-charles-cinema/")).toBe(false);
    expect(isDisallowed("/sitemap.xml")).toBe(false);
    expect(isDisallowed("/llms.txt")).toBe(false);
  });

  it("still blocks the public profile template", () => {
    expect(isDisallowed("/profile-shell/")).toBe(true);
  });
});
