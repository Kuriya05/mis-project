import type { MyProfile, Permission } from "../types";

// สิทธิ์เดียวกับนักศึกษาใน backend (backend/src/auth/permissions.ts → PARTICIPANT_PERMISSIONS)
const STUDENT_PERMISSIONS: Permission[] = [
  "question:read",
  "tag:read",
  "profile:read:own",
  "question:create",
  "question:update:own",
  "question:delete:own",
  "question:vote",
  "question:bookmark",
  "comment:create",
  "comment:update:own",
  "comment:delete:own",
  "comment:vote",
  "comment:verify:own",
];

export const DEMO_USER_ID = "demo-wannapa";
/** รหัสสมมติ (6599xxxxxx ไม่ใช่รหัสนักศึกษาจริง) */
export const DEMO_PERSON_CODE = "6599000011";

export function demoProfile(): MyProfile {
  const now = new Date();
  return {
    id: DEMO_USER_ID,
    coreUserId: "seed-student-wannapa",
    email: "demo@mju.ac.th",
    personCode: DEMO_PERSON_CODE,
    coreRole: "student",
    subsystemRole: "STUDENT",
    permissions: STUDENT_PERMISSIONS,
    session: { expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString() },
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
  };
}
