import { CoreRole, Profile } from '../../generated/prisma/client';

/** JSON uses the Core Hub vocabulary (`student`, `staff`, ...) — data-dictionary.md ข้อ 4. */
const CORE_ROLE_TO_CLAIM: Readonly<Record<CoreRole, string>> = {
  [CoreRole.STUDENT]: 'student',
  [CoreRole.ALUMNI]: 'alumni',
  [CoreRole.STAFF]: 'staff',
  [CoreRole.ADMIN]: 'admin',
};

const CLAIM_TO_CORE_ROLE: Readonly<Record<string, CoreRole>> = {
  student: CoreRole.STUDENT,
  alumni: CoreRole.ALUMNI,
  staff: CoreRole.STAFF,
  admin: CoreRole.ADMIN,
};

export function coreRoleFromClaim(claim: string): CoreRole | null {
  return CLAIM_TO_CORE_ROLE[claim.trim().toLowerCase()] ?? null;
}

export function coreRoleToClaim(role: CoreRole): string {
  return CORE_ROLE_TO_CLAIM[role];
}

export interface AuthorView {
  id: string;
  displayName: string;
  coreRole: string;
}

export const AUTHOR_SELECT = { id: true, displayName: true, coreRole: true } as const;

export function toAuthorView(profile: Pick<Profile, 'id' | 'displayName' | 'coreRole'>): AuthorView {
  return {
    id: profile.id,
    displayName: profile.displayName,
    coreRole: coreRoleToClaim(profile.coreRole),
  };
}
