import { describe, expect, it } from "vitest";
import { FACULTY } from "@/data/faculty";
import {
  AREA_TAGS,
  MAX_RECOMMENDED,
  areasForTags,
  facultyForTags,
  questionsForLecturer,
  recommendedLecturers,
} from "./faculty-match";

describe("faculty from tags", () => {
  it("maps tags to areas word by word", () => {
    expect(areasForTags(["Database"])).toEqual(expect.arrayContaining(["database", "data"]));
    expect(areasForTags(["Machine-Learning"])).toContain("ai");
    expect(areasForTags(["Thai"])).not.toContain("ai");
    expect(areasForTags(["ฐานข้อมูล"])).toContain("database");
    expect(areasForTags(["General", "Error"])).toEqual([]);
  });

  it("picks lecturers whose areas match the tags", () => {
    const lecturers = facultyForTags(["IoT"]);
    expect(lecturers.length).toBeGreaterThan(0);
    for (const f of lecturers) expect(f.areas).toContain("iot");
    expect(facultyForTags(["General"])).toEqual([]);
  });
});

describe("recommended lecturers", () => {
  const iot = facultyForTags(["IoT"]);

  it("lists every lecturer the tags point at", () => {
    expect(iot.length).toBeGreaterThan(1);
    expect(recommendedLecturers([], iot)).toEqual(iot.map((f) => f.id));
  });

  it("puts the AI picks first, without repeats or unknown ids, and caps the list", () => {
    const extra = FACULTY.find((f) => !f.areas.includes("iot"))!.id;
    expect(recommendedLecturers([extra, "made-up", extra], iot)[0]).toBe(extra);
    expect(recommendedLecturers(FACULTY.map((f) => f.id), [])).toHaveLength(MAX_RECOMMENDED);
  });
});

describe("asking a lecturer from the directory", () => {
  it("gives every area a tag that maps back to the same area", () => {
    for (const [area, tag] of Object.entries(AREA_TAGS)) {
      expect(areasForTags([tag])).toContain(area);
    }
  });

  it("puts the lecturer among the recommendations for their own tags", () => {
    for (const lecturer of FACULTY) {
      const ids = facultyForTags(lecturer.areas.map((a) => AREA_TAGS[a])).map((f) => f.id);
      expect(ids).toContain(lecturer.id);
    }
  });

  it("finds the questions whose tags match the lecturer's areas", () => {
    const iotLecturer = FACULTY.find((f) => f.areas.includes("iot"))!;
    const questions = [
      { id: "1", tags: ["IoT"] },
      { id: "2", tags: ["General"] },
    ];
    expect(questionsForLecturer(iotLecturer, questions).map((q) => q.id)).toEqual(["1"]);
  });
});
