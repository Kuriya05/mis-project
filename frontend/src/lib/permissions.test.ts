import { describe, expect, it } from "vitest";
import { can, canOnResource, initialsOf, isStaffRole, roleLabel } from "./permissions";
import type { Permission } from "./types";

const user = (permissions: Permission[]) => ({ id: "me", permissions });

describe("permissions", () => {
  it("labels the Core Hub roles in Thai", () => {
    expect(roleLabel("student")).toBe("นักศึกษา");
    expect(roleLabel("lecturer")).toBe("อาจารย์");
    expect(roleLabel("staff")).toBe("เจ้าหน้าที่");
    expect(roleLabel("guest")).toBe("ผู้เยี่ยมชม");
    expect(roleLabel("unknown")).toBe("ผู้ใช้");
    expect(isStaffRole("admin")).toBe(true);
    expect(isStaffRole("lecturer")).toBe(true);
    expect(isStaffRole("alumni")).toBe(false);
  });

  it("only offers what the backend granted", () => {
    expect(can(user(["question:create"]), "question:create")).toBe(true);
    expect(can(user([]), "question:create")).toBe(false);
    expect(can(null, "question:read")).toBe(false);
  });

  it("allows :own on your own resource and :any on everyone's", () => {
    const owner = user(["question:update:own"]);
    expect(canOnResource(owner, "me", "question:update:own", "question:update:any")).toBe(true);
    expect(canOnResource(owner, "other", "question:update:own", "question:update:any")).toBe(false);
    const admin = user(["question:update:any"]);
    expect(canOnResource(admin, "other", "question:update:own", "question:update:any")).toBe(true);
  });

  it("builds initials for Thai and English names", () => {
    expect(initialsOf("อาจารย์สมศักดิ์")).toBe("อ");
    expect(initialsOf("Somchai Jaidee")).toBe("SJ");
    expect(initialsOf("  ")).toBe("?");
  });
});
