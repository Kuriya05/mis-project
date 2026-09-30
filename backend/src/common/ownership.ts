import { Injectable } from '@nestjs/common';
import { AuthEventsLogger } from '../auth/auth-events.logger';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission, can } from '../auth/permissions';
import { AppException } from './errors';

/**
 * Service-layer half of `:own` / `:any` (authorization.md ข้อ 4): the guard
 * already let the request through, this checks the record itself.
 * Ownership = the record's author profile carries the caller's `sub`.
 */
@Injectable()
export class OwnershipPolicy {
  constructor(private readonly authEvents: AuthEventsLogger) {}

  assert(
    user: CoreHubIdentity,
    ownerCoreUserId: string,
    permissions: { own: Permission; any: Permission },
    reason: string,
  ): void {
    if (can(user.subsystemRole, permissions.any)) {
      return;
    }
    if (can(user.subsystemRole, permissions.own) && ownerCoreUserId === user.id) {
      return;
    }
    this.authEvents.authorizationDenied({
      sub: user.id,
      subsystemRole: user.subsystemRole,
      reason: `not_owner:${reason}`,
    });
    throw AppException.forbidden('You do not have permission to perform this action');
  }
}
