import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CapabilityId,
  getGrantedCapabilities,
  parseCapabilities,
} from "./index";

describe("parseCapabilities", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps the capabilities this build knows", () => {
    expect(parseCapabilities({ emailAlerts: { grantedAt: 1 } })).toEqual({
      [CapabilityId.EmailAlerts]: { grantedAt: 1 },
    });
    expect(parseCapabilities(undefined)).toEqual({});
  });

  it("warns about and drops one it doesn't", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseCapabilities({ betaThing: { grantedAt: 1 } })).toEqual({});
    expect(warn).toHaveBeenCalledWith(
      'Ignoring unknown capability "betaThing"',
    );
  });
});

describe("getGrantedCapabilities", () => {
  it("lists them in the registry's order, whatever the stored order", () => {
    expect(
      getGrantedCapabilities({
        [CapabilityId.PublicProfile]: { grantedAt: 1 },
        [CapabilityId.EmailAlerts]: { grantedAt: 2 },
      }),
    ).toEqual([CapabilityId.EmailAlerts, CapabilityId.PublicProfile]);
  });
});
