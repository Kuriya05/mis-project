import { CoreRole, Profile } from '../../generated/prisma/client';

/** JSON uses the Core Hub vocabulary (`student`, `staff`, ...) — data-dictionary.md ข้อ 4. */
const CORE_ROLE_TO_CLAIM: Readonly<Record<CoreRole, string>> = {
  [CoreRole.STUDENT]: 'student',
  [CoreRole.ALUMNI]: 'alumni',
  [CoreRole.STAFF]: 'staff',
  [CoreRole.ADMIN]: 'admin',
  [CoreRole.LECTURER]: 'lecturer',
  [CoreRole.GUEST]: 'guest',
};

const CLAIM_TO_CORE_ROLE: Readonly<Record<string, CoreRole>> = {
  student: CoreRole.STUDENT,
  alumni: CoreRole.ALUMNI,
  staff: CoreRole.STAFF,
  admin: CoreRole.ADMIN,
  lecturer: CoreRole.LECTURER,
  guest: CoreRole.GUEST,
};

export function coreRoleFromClaim(claim: string): CoreRole | null {
  return CLAIM_TO_CORE_ROLE[claim.trim().toLowerCase()] ?? null;
}

export function coreRoleToClaim(role: CoreRole): string {
  return CORE_ROLE_TO_CLAIM[role];
}

/** An author is shown by person_code and role only - never a name (reference-data.md 8). */
export interface AuthorView {
  id: string;
  personCode: string | null;
  coreRole: string;
  /** The subsystem's AI assistant, not a person. */
  isAssistant: boolean;
}

export const AUTHOR_SELECT = { id: true, personCode: true, coreRole: true, isAssistant: true } as const;

export function toAuthorView(
  profile: Pick<Profile, 'id' | 'personCode' | 'coreRole' | 'isAssistant'>,
): AuthorView {
  return {
    id: profile.id,
    personCode: profile.personCode,
    isAssistant: profile.isAssistant,
    coreRole: coreRoleToClaim(profile.coreRole),
  };
}
