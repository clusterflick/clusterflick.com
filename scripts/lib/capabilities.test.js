import { describe, expect, it } from "vitest";
import { CAPABILITY_IDS, parseArgs, planChange } from "./capabilities";
import { CAPABILITIES, CapabilityId } from "@/lib/user-capabilities";

describe("CAPABILITY_IDS", () => {
  it("is the site's registry", () => {
    expect([...CAPABILITY_IDS].sort()).toEqual(
      Object.values(CapabilityId).sort(),
    );
    expect(Object.keys(CAPABILITIES).sort()).toEqual(
      [...CAPABILITY_IDS].sort(),
    );
  });
});

describe("parseArgs", () => {
  it("reads a grant, a dry run unless told to write", () => {
    expect(parseArgs(["a@example.com", "emailAlerts"])).toEqual({
      email: "a@example.com",
      capability: "emailAlerts",
      revoke: false,
      write: false,
    });
    expect(
      parseArgs(["--write", "a@example.com", "--revoke", "publicProfile"]),
    ).toMatchObject({ revoke: true, write: true });
  });

  it("refuses an unknown capability rather than writing one", () => {
    expect(() => parseArgs(["a@example.com", "emailAlert"])).toThrow(
      'Unknown capability "emailAlert"',
    );
  });

  it("refuses a missing argument, a non-address and an unknown option", () => {
    expect(() => parseArgs(["a@example.com"])).toThrow("Usage");
    expect(() => parseArgs(["someone", "emailAlerts"])).toThrow(
      "isn't an email address",
    );
    expect(() =>
      parseArgs(["a@example.com", "emailAlerts", "--dry-run"]),
    ).toThrow("Unknown option --dry-run");
  });
});

describe("planChange", () => {
  const grant = { capability: "emailAlerts", revoke: false };
  const revoke = { capability: "emailAlerts", revoke: true };

  it("grants beside what's already granted", () => {
    expect(planChange({ publicProfile: { grantedAt: 1 } }, grant, 5)).toEqual({
      publicProfile: { grantedAt: 1 },
      emailAlerts: { grantedAt: 5 },
    });
    expect(planChange(undefined, grant, 5)).toEqual({
      emailAlerts: { grantedAt: 5 },
    });
  });

  it("changes nothing for a repeated grant, keeping when it was granted", () => {
    expect(planChange({ emailAlerts: { grantedAt: 1 } }, grant, 5)).toBeNull();
  });

  it("revokes, and changes nothing when there was nothing to revoke", () => {
    expect(
      planChange(
        { emailAlerts: { grantedAt: 1 }, publicProfile: { grantedAt: 2 } },
        revoke,
        5,
      ),
    ).toEqual({ publicProfile: { grantedAt: 2 } });
    expect(planChange({ emailAlerts: { grantedAt: 1 } }, revoke, 5)).toEqual(
      {},
    );
    expect(planChange(undefined, revoke, 5)).toBeNull();
  });
});
