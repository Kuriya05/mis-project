/**
 * All environment-specific values live here. Nothing in the application code
 * may hard-code a URL, issuer, audience or secret (spec §30, §41.15).
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  /**
   * Value for Express's `trust proxy`, or false to leave it unset.
   *
   * Rate limiting keys callers on `request.ip`, which Express derives from
   * X-Forwarded-For only for hops this setting trusts. Unset means no proxy:
   * `request.ip` is the socket address and a forged header is ignored. On the
   * dev server use `loopback, uniquelocal` so Express skips the internal hops
   * and takes the public address Cloudflare appended on the right.
   */
  trustProxy: TrustProxy;
  subsystemId: string;
  subsystemName: string;
  /**
   * Connection pool and timeout ceilings. Prisma 7 talks to PostgreSQL through
   * a node-postgres driver adapter, so these are pool options rather than
   * DATABASE_URL query parameters.
   */
  database: {
    poolMax: number;
    connectTimeoutMs: number;
    idleTimeoutMs: number;
    statementTimeoutMs: number;
    idleInTransactionTimeoutMs: number;
  };
  coreHub: {
    url: string;
    /**
     * Core Hub's web app, where GET /auth/login sends the browser. It must be
     * the address the *browser* uses: this subsystem answers 302 and the
     * browser follows it, so a Docker-internal host name would not resolve.
     */
    webUrl: string;
    jwksUrl: string;
    issuer: string;
    audience: string;
    jwksCacheTtlMs: number;
    jwksMinRefreshIntervalMs: number;
    jwksRequestTimeoutMs: number;
    clockToleranceSec: number;
    /** Reference data cache (reference-data.md) */
    dataCacheTtlMs: number;
    dataMinRefreshIntervalMs: number;
    dataRequestTimeoutMs: number;
  };
  /**
   * The Next.js frontend this backend serves on the same origin, so the SSO
   * cookie and every relative redirect land on the page the user is looking at.
   */
  frontend: {
    /** Next server that page requests are passed to. null = API only. */
    url: string | null;
  };
  /** AI assistant (Gemini). An empty key turns every AI feature off. */
  gemini: {
    apiKey: string;
    /** Tried in order: the next one when a model is busy (429/503) or retired (404). */
    models: string[];
    apiUrl: string;
    timeoutMs: number;
  };
  /**
   * HTTP rate limiting in two layers (SSO spec D10). Each layer runs a short
   * window that absorbs bursts and a long one that caps sustained traffic.
   */
  throttle: {
    /** Per address, before the token is checked: loose, against floods. */
    ip: ThrottleWindows;
    /** Per verified user, after the token is checked. */
    user: ThrottleWindows;
  };
}

export type TrustProxy = false | number | string;

export interface ThrottleWindows {
  burstTtlMs: number;
  burstLimit: number;
  sustainedTtlMs: number;
  sustainedLimit: number;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * TRUST_PROXY: empty or `false` leaves `trust proxy` unset; a whole number is
 * a hop count; anything else goes to Express as written, e.g.
 * `loopback, uniquelocal`.
 */
export function parseTrustProxy(value: string | undefined): TrustProxy {
  const raw = value?.trim() ?? '';

  if (raw === '' || raw.toLowerCase() === 'false') {
    return false;
  }

  if (/^\d+$/.test(raw)) {
    const hops = Number(raw);
    return hops === 0 ? false : hops;
  }

  return raw;
}

function windows(prefix: string, defaults: ThrottleWindows): ThrottleWindows {
  const env = process.env;
  return {
    burstTtlMs: num(env[`${prefix}_BURST_TTL_MS`], defaults.burstTtlMs),
    burstLimit: num(env[`${prefix}_BURST_LIMIT`], defaults.burstLimit),
    sustainedTtlMs: num(env[`${prefix}_SUSTAINED_TTL_MS`], defaults.sustainedTtlMs),
    sustainedLimit: num(env[`${prefix}_SUSTAINED_LIMIT`], defaults.sustainedLimit),
  };
}

export default (): AppConfig => {
  const coreHubUrl = process.env.CORE_HUB_URL ?? 'http://localhost:3000';

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: num(process.env.PORT, 4235),
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    subsystemId: process.env.SUBSYSTEM_ID ?? 'csmju-study-qa',
    subsystemName: process.env.SUBSYSTEM_NAME ?? 'ถาม-ตอบวิชาการ CS แม่โจ้',
    database: {
      poolMax: num(process.env.DATABASE_POOL_MAX, 10),
      connectTimeoutMs: num(process.env.DATABASE_CONNECT_TIMEOUT_MS, 5000),
      idleTimeoutMs: num(process.env.DATABASE_IDLE_TIMEOUT_MS, 30_000),
      statementTimeoutMs: num(process.env.DATABASE_STATEMENT_TIMEOUT_MS, 5000),
      idleInTransactionTimeoutMs: num(process.env.DATABASE_IDLE_IN_TRANSACTION_TIMEOUT_MS, 10_000),
    },
    coreHub: {
      url: coreHubUrl,
      // On the real server the web app and the API share one origin.
      webUrl: (process.env.CORE_HUB_WEB_URL ?? coreHubUrl).replace(/\/+$/, ''),
      jwksUrl:
        process.env.CORE_HUB_JWKS_URL ??
        `${coreHubUrl.replace(/\/+$/, '')}/api/v1/.well-known/jwks.json`,
      issuer: process.env.CORE_HUB_ISSUER ?? 'core-hub',
      audience: process.env.CORE_HUB_AUDIENCE ?? 'csmju2030',
      jwksCacheTtlMs: num(process.env.JWKS_CACHE_TTL_MS, 10 * 60 * 1000),
      jwksMinRefreshIntervalMs: num(process.env.JWKS_MIN_REFRESH_INTERVAL_MS, 30 * 1000),
      jwksRequestTimeoutMs: num(process.env.JWKS_REQUEST_TIMEOUT_MS, 5000),
      clockToleranceSec: num(process.env.JWT_CLOCK_TOLERANCE_SEC, 5),
      dataCacheTtlMs: num(process.env.CORE_HUB_DATA_CACHE_TTL_MS, 10 * 60 * 1000),
      dataMinRefreshIntervalMs: num(process.env.CORE_HUB_DATA_MIN_REFRESH_INTERVAL_MS, 30 * 1000),
      dataRequestTimeoutMs: num(process.env.CORE_HUB_DATA_REQUEST_TIMEOUT_MS, 5000),
    },
    frontend: {
      url: process.env.FRONTEND_URL?.trim().replace(/\/+$/, '') || null,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY?.trim() ?? '',
      models: (process.env.GEMINI_MODELS ?? 'gemini-3.5-flash,gemini-flash-lite-latest')
        .split(',')
        .map((model) => model.trim())
        .filter((model) => model !== ''),
      apiUrl: (
        process.env.GEMINI_API_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta'
      ).replace(/\/+$/, ''),
      timeoutMs: num(process.env.GEMINI_TIMEOUT_MS, 30_000),
    },
    throttle: {
      // A lab of 50 people behind one NAT address opening a page together is
      // about 500 requests, so the per-address layer only stops real floods.
      ip: windows('THROTTLE_IP', {
        burstTtlMs: 10_000,
        burstLimit: 600,
        sustainedTtlMs: 60_000,
        sustainedLimit: 3000,
      }),
      // Ten requests a second for a whole minute is a script, not a person.
      user: windows('THROTTLE_USER', {
        burstTtlMs: 10_000,
        burstLimit: 100,
        sustainedTtlMs: 60_000,
        sustainedLimit: 600,
      }),
    },
  };
};
