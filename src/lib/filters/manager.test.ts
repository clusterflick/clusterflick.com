import { describe, expect, it } from "vitest";
import { FilterId } from "./types";
import {
  get,
  getBrowseAllState,
  getDefaultState,
  getPermissiveState,
  resolveFilterStateFromUrl,
} from "./manager";

describe("base=all", () => {
  it("opens every category and date but keeps past showings hidden", () => {
    const state = resolveFilterStateFromUrl("?base=all", getDefaultState())!;
    expect(get(state, FilterId.Categories)).toBeNull();
    expect(get(state, FilterId.DateRange)).toEqual({ start: null, end: null });
    expect(get(state, FilterId.HideFinished)).toBe(true);
  });

  // The permissive state is the widest a search can be widened to, so it has
  // to include finished showings; a link a reader follows to browse must not.
  it("differs from the permissive state only in finished showings", () => {
    expect(get(getPermissiveState(), FilterId.HideFinished)).toBe(false);
    expect({
      ...getBrowseAllState(),
      [FilterId.HideFinished]: false,
    }).toEqual(getPermissiveState());
  });
});
