import type { MyProfile, Permission } from "../types";

// สิทธิ์เดียวกับนักศึกษาใน backend (backend/src/auth/permissions.ts → PARTICIPANT_PERMISSIONS)
const STUDENT_PERMISSIONS: Permission[] = [
  "question:read",
  "tag:read",
  "profile:read:own",
  "profile:update:own",
  "question:create",
  "question:update:own",
  "question:delete:own",
  "question:vote",
  "comment:create",
  "comment:update:own",
  "comment:delete:own",
  "comment:vote",
  "comment:verify:own",
];

export const DEMO_USER_ID = "demo-wannapa";
export const DEMO_DEFAULT_NAME = "Wannapa C.";

export function demoProfile(displayName: string = DEMO_DEFAULT_NAME): MyProfile {
  const now = new Date();
  return {
    id: DEMO_USER_ID,
    coreUserId: "seed-student-wannapa",
    email: "demo@mju.ac.th",
    displayName,
    coreRole: "student",
    subsystemRole: "STUDENT",
    permissions: STUDENT_PERMISSIONS,
    session: { expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString() },
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
  };
}
