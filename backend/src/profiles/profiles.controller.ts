import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Profile } from '../../generated/prisma/client';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CoreHubAccessToken } from '../auth/decorators/core-hub-access-token.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission, ROLE_PERMISSIONS } from '../auth/permissions';
import { ActivityService } from './activity.service';
import { coreRoleToClaim } from './profile.view';
import { ProfilesService } from './profiles.service';

/**
 * The caller's own profile. The frontend loads it once to know who is signed
 * in, what the UI may offer (permissions) and when to renew the session.
 */
@Controller('v1/profiles')
export class ProfilesController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly activities: ActivityService,
  ) {}

  @Get('me')
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  async me(@CurrentUser() user: CoreHubIdentity, @CoreHubAccessToken() token: string) {
    return this.view(user, await this.profiles.ensure(user, token));
  }

  /** Answers and replies others (the AI assistant included) wrote on the caller's questions. */
  @Get('me/activity')
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  activity(@CurrentUser() user: CoreHubIdentity) {
    return this.activities.activity(user);
  }

  /** Everything up to now has been read. */
  @Post('me/activity/seen')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  markSeen(@CurrentUser() user: CoreHubIdentity) {
    return this.activities.markSeen(user);
  }

  private view(user: CoreHubIdentity, profile: Profile) {
    return {
      id: profile.id,
      coreUserId: profile.coreUserId,
      email: user.email,
      personCode: profile.personCode,
      coreRole: coreRoleToClaim(profile.coreRole),
      subsystemRole: user.subsystemRole,
      permissions: ROLE_PERMISSIONS[user.subsystemRole],
      session: { expiresAt: user.exp !== undefined ? new Date(user.exp * 1000).toISOString() : null },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
