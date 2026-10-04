import { SubsystemRole } from './core-hub-identity';

/**
 * Subsystem permissions (authorization.md ข้อ 4).
 *
 *   Core JWT -> Core Role -> Subsystem Role -> Permission -> Business Operation
 *
 * Business code asks for a permission, never for `role === 'admin'`.
 * `:own` variants are scope hints: the guard lets the request through and the
 * service performs the ownership check against the actual record
 * (`profile.core_user_id === token.sub`).
 */
export enum Permission {
  QUESTION_READ = 'question:read',
  QUESTION_CREATE = 'question:create',
  QUESTION_UPDATE_OWN = 'question:update:own',
  QUESTION_UPDATE_ANY = 'question:update:any',
  QUESTION_DELETE_OWN = 'question:delete:own',
  QUESTION_DELETE_ANY = 'question:delete:any',
  QUESTION_VOTE = 'question:vote',
  /** Save a question to read later - every role, alumni included. */
  QUESTION_BOOKMARK = 'question:bookmark',

  COMMENT_CREATE = 'comment:create',
  COMMENT_UPDATE_OWN = 'comment:update:own',
  COMMENT_UPDATE_ANY = 'comment:update:any',
  COMMENT_DELETE_OWN = 'comment:delete:own',
  COMMENT_DELETE_ANY = 'comment:delete:any',
  COMMENT_VOTE = 'comment:vote',
  /** `:own` = the caller asked the question the answer belongs to. */
  COMMENT_VERIFY_OWN = 'comment:verify:own',
  COMMENT_VERIFY_ANY = 'comment:verify:any',

  TAG_READ = 'tag:read',

  PROFILE_READ_OWN = 'profile:read:own',

  SAMPLE_DATA_LOAD = 'sample-data:load',
}

/** Alumni and every other role can browse the board and see their own profile. */
const READ_PERMISSIONS: Permission[] = [
  Permission.QUESTION_READ,
  Permission.QUESTION_BOOKMARK,
  Permission.TAG_READ,
  Permission.PROFILE_READ_OWN,
];

const PARTICIPANT_PERMISSIONS: Permission[] = [
  ...READ_PERMISSIONS,
  Permission.QUESTION_CREATE,
  Permission.QUESTION_UPDATE_OWN,
  Permission.QUESTION_DELETE_OWN,
  Permission.QUESTION_VOTE,
  Permission.COMMENT_CREATE,
  Permission.COMMENT_UPDATE_OWN,
  Permission.COMMENT_DELETE_OWN,
  Permission.COMMENT_VOTE,
  Permission.COMMENT_VERIFY_OWN,
];

/** Teachers may mark the correct answer on any question. */
const STAFF_PERMISSIONS: Permission[] = [...PARTICIPANT_PERMISSIONS, Permission.COMMENT_VERIFY_ANY];

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<Record<SubsystemRole, readonly Permission[]>> =
  Object.freeze({
    [SubsystemRole.STUDENT]: Object.freeze(PARTICIPANT_PERMISSIONS),
    [SubsystemRole.ALUMNI]: Object.freeze(READ_PERMISSIONS),
    [SubsystemRole.STAFF]: Object.freeze(STAFF_PERMISSIONS),
    [SubsystemRole.ADMIN]: Object.freeze(ADMIN_PERMISSIONS),
  });

/** Does this subsystem role hold the given permission? */
export function can(role: SubsystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Does this subsystem role hold at least one of the given permissions? */
export function canAny(role: SubsystemRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}
