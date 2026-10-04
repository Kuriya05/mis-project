import { HttpStatus, Injectable } from '@nestjs/common';
import { Profile } from '../../generated/prisma/client';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { AppException } from '../common/errors';
import { PeopleService } from '../core-hub/people.service';
import { PrismaService } from '../prisma/prisma.service';
import { coreRoleFromClaim } from './profile.view';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: PeopleService,
  ) {}

  /**
   * The local record for the verified caller, created on first sight. core_role
   * is a copy of the token claim and is refreshed whenever Core Hub changes it.
   *
   * With the caller's token, a profile that has no person_code yet asks Core
   * Hub for it (GET /people/me) - when the profile is shown or the caller
   * writes a question or an answer. person_code only labels authors, so a
   * Core Hub that cannot answer leaves it null (the role is shown instead)
   * rather than failing the request (reference-data.md 9) - except 401, which
   * means the session is over.
   */
  async ensure(user: CoreHubIdentity, token?: string): Promise<Profile> {
    const profile = await this.ensureRecord(user);
    if (token === undefined || profile.personCode !== null) {
      return profile;
    }

    let personCode: string | null;
    try {
      personCode = await this.people.myPersonCode(token);
    } catch (error) {
      if (error instanceof AppException && error.getStatus() === HttpStatus.UNAUTHORIZED) {
        throw error;
      }
      return profile;
    }
    if (personCode === null) {
      return profile;
    }
    return this.prisma.profile.update({ where: { id: profile.id }, data: { personCode } });
  }

  private async ensureRecord(user: CoreHubIdentity): Promise<Profile> {
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
      create: { coreUserId: user.id, coreRole },
    });
  }
}
