import { describe, expect, it } from "vitest";
import { forumHref, parseForumFilters } from "./filters";

describe("forum filters", () => {
  it("keeps the new tabs in the URL", () => {
    for (const tab of ["resolved", "popular"] as const) {
      const filters = parseForumFilters({ tab });
      expect(filters.tab).toBe(tab);
      expect(forumHref(filters)).toBe(`/questions?tab=${tab}`);
    }
  });

  it("falls back to all for an unknown tab", () => {
    expect(parseForumFilters({ tab: "random" }).tab).toBe("all");
    expect(forumHref(parseForumFilters({}))).toBe("/questions");
  });
});
