import { describe, it, expect } from "vitest";
import { condenseVenues } from "./condense-venues";
import type { UpdateVenue } from "./get-updates";

describe("condenseVenues", () => {
  const chain = (name: string) => ({
    name,
    href: `/cinema-groups/${name.toLowerCase()}`,
  });
  const v = (id: string, group?: string): UpdateVenue => ({
    id,
    name: id,
    href: null,
    ...(group ? { group: chain(group) } : {}),
  });
  const describeEntries = (venues: UpdateVenue[], limit = 3) => {
    const { entries, hiddenVenues, isCondensed } = condenseVenues(
      venues,
      limit,
    );
    return {
      entries: entries.map((entry) =>
        entry.kind === "group"
          ? `${entry.count} ${entry.group.name}`
          : entry.venue.id,
      ),
      hiddenVenues,
      isCondensed,
    };
  };

  it("leaves a short list of standalone venues alone", () => {
    expect(describeEntries([v("a"), v("b"), v("c")])).toEqual({
      entries: ["a", "b", "c"],
      hiddenVenues: 0,
      isCondensed: false,
    });
  });

  it("names a lone venue of a chain rather than counting it", () => {
    expect(describeEntries([v("a", "Vue"), v("b")]).entries).toEqual([
      "a",
      "b",
    ]);
  });

  it("counts chains, largest first, ahead of standalone venues", () => {
    expect(
      describeEntries([
        v("a"),
        v("vue-1", "Vue"),
        v("cw-1", "Cineworld"),
        v("cw-2", "Cineworld"),
        v("cw-3", "Cineworld"),
        v("vue-2", "Vue"),
      ]),
    ).toEqual({
      entries: ["3 Cineworld", "2 Vue", "a"],
      hiddenVenues: 0,
      isCondensed: true,
    });
  });

  it("cuts to the limit and counts the venues behind the cut", () => {
    expect(
      describeEntries([
        v("cw-1", "Cineworld"),
        v("cw-2", "Cineworld"),
        v("a"),
        v("b"),
        v("c"),
        v("d"),
      ]),
    ).toEqual({
      entries: ["2 Cineworld", "a", "b"],
      hiddenVenues: 2,
      isCondensed: true,
    });
  });

  it("shows the last item rather than cutting it alone", () => {
    expect(describeEntries([v("a"), v("b"), v("c"), v("d")])).toEqual({
      entries: ["a", "b", "c", "d"],
      hiddenVenues: 0,
      isCondensed: false,
    });
  });
});
