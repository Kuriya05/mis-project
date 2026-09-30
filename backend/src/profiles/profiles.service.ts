import { Injectable } from '@nestjs/common';
import { Profile } from '../../generated/prisma/client';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { coreRoleFromClaim } from './profile.view';

const FALLBACK_DISPLAY_NAME = 'ผู้ใช้';
const DISPLAY_NAME_MAX = 100;

/** Core Hub v1.0 has no full name, so a first-time user starts with the local part of the e-mail. */
export function defaultDisplayName(email: string): string {
  const local = email.split('@')[0]?.trim() ?? '';
  return (local || FALLBACK_DISPLAY_NAME).slice(0, DISPLAY_NAME_MAX);
}

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The local record for the verified caller, created on first sight. core_role
   * is a copy of the token claim and is refreshed whenever Core Hub changes it.
   */
  async ensure(user: CoreHubIdentity): Promise<Profile> {
    const coreRole = coreRoleFromClaim(user.coreRole);
    if (!coreRole) {
      throw AppException.forbidden('Your Core Hub role has no access to this subsystem');
    }

    const existing = await this.prisma.profile.findUnique({ where: { coreUserId: user.id } });
    if (existing) {
      if (existing.coreRole === coreRole) {
        return existing;
      }
      return this.prisma.profile.update({ where: { id: existing.id }, data: { coreRole } });
    }

    return this.prisma.profile.upsert({
      where: { coreUserId: user.id },
      update: { coreRole },
      create: { coreUserId: user.id, coreRole, displayName: defaultDisplayName(user.email) },
    });
  }

  async updateDisplayName(user: CoreHubIdentity, displayName: string): Promise<Profile> {
    const profile = await this.ensure(user);
    return this.prisma.profile.update({ where: { id: profile.id }, data: { displayName } });
  }
}
