import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Profile } from '../../generated/prisma/client';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission, ROLE_PERMISSIONS } from '../auth/permissions';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { coreRoleToClaim } from './profile.view';
import { ProfilesService } from './profiles.service';

/**
 * The caller's own profile. The frontend loads it once to know who is signed
 * in, what the UI may offer (permissions) and when to renew the session.
 */
@Controller('v1/profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('me')
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  async me(@CurrentUser() user: CoreHubIdentity) {
    return this.view(user, await this.profiles.ensure(user));
  }

  @Patch('me')
  @RequirePermissions(Permission.PROFILE_UPDATE_OWN)
  async update(@CurrentUser() user: CoreHubIdentity, @Body() dto: UpdateProfileDto) {
    return this.view(user, await this.profiles.updateDisplayName(user, dto.displayName));
  }

  private view(user: CoreHubIdentity, profile: Profile) {
    return {
      id: profile.id,
      coreUserId: profile.coreUserId,
      email: user.email,
      displayName: profile.displayName,
      coreRole: coreRoleToClaim(profile.coreRole),
      subsystemRole: user.subsystemRole,
      permissions: ROLE_PERMISSIONS[user.subsystemRole],
      session: { expiresAt: user.expiresAt },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
