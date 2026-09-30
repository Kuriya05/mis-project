/**
 * Static environment for the e2e suites. It runs before each test file (and
 * thus before AppModule is imported and its env validation executes).
 *
 * The suites talk to a real PostgreSQL database: TEST_DATABASE_URL, never the
 * development database. Credentials come from the environment or backend/.env
 * (กฎ SEC-01: no user:password in code).
 */
import { testDatabaseUrl } from './helpers/test-database';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.CORE_HUB_ISSUER = 'core-hub';
process.env.CORE_HUB_AUDIENCE = 'csmju2030';
process.env.JWKS_CACHE_TTL_MS = '60000';
process.env.JWKS_MIN_REFRESH_INTERVAL_MS = '1';
process.env.SUBSYSTEM_ID = 'csmju-helpdesk';
process.env.CORE_HUB_WEB_URL = 'http://hub-web.test';

// ConfigModule also reads backend/.env, which differs from one machine to the
// next. Pin everything the suites assert on, so a developer's local .env
// cannot change the result. (An empty value still counts as set.)
process.env.SSO_STATE_TTL_SEC = '600';
process.env.SSO_POST_LOGIN_REDIRECT = '/api/v1/me';
process.env.TRUST_PROXY = '';
process.env.FRONTEND_URL = '';
process.env.DATABASE_STATEMENT_TIMEOUT_MS = '15000';

// The functional suites drive hundreds of requests from one address as fast as
// supertest can issue them. Rate limiting is proven on purpose in
// hardening.e2e-spec.ts, which boots with the shipped defaults or its own low
// limits; everywhere else both layers are raised so a 429 cannot mask a
// functional failure.
for (const layer of ['IP', 'USER']) {
  process.env[`THROTTLE_${layer}_BURST_LIMIT`] = '100000';
  process.env[`THROTTLE_${layer}_SUSTAINED_LIMIT`] = '100000';
}
