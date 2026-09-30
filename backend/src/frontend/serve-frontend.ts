import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { type IncomingMessage, request as httpRequest } from 'node:http';
import { connect, type Socket } from 'node:net';

/** Paths the Nest router owns; everything else belongs to the Next.js frontend. */
const BACKEND_PREFIXES = ['/api', '/auth'];

// Hop-by-hop headers are about one connection and must not be forwarded (RFC 9110 7.6.1).
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export function isBackendPath(path: string): boolean {
  return BACKEND_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function forwardedHeaders(
  incoming: IncomingMessage,
  remoteAddress: string | undefined,
): Record<string, string | string[]> {
  const headers: Record<string, string | string[]> = {};
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (value !== undefined && !HOP_BY_HOP.has(name)) {
      headers[name] = value;
    }
  }
  // Next.js builds absolute URLs (redirects, metadata) from these, so it sees the
  // origin the browser used, not the internal address of the Next server.
  headers['x-forwarded-host'] = incoming.headers.host ?? '';
  headers['x-forwarded-proto'] = (incoming.socket as { encrypted?: boolean }).encrypted
    ? 'https'
    : 'http';
  if (remoteAddress) {
    headers['x-forwarded-for'] = remoteAddress;
  }
  return headers;
}

/**
 * Serves the Next.js frontend from this origin so the SSO session cookie and
 * every relative redirect (e.g. `next` after /auth/callback) land on the app
 * itself: every request outside /api and /auth is passed through to the Next
 * server at FRONTEND_URL, and the answer is streamed back unchanged.
 * Without FRONTEND_URL the backend serves the API only.
 */
export function serveFrontend(app: NestExpressApplication): void {
  const config = app.get(ConfigService);
  const logger = new Logger('Frontend');
  const frontendUrl = config.get<string | null>('frontend.url', null);

  if (!frontendUrl) {
    logger.warn('FRONTEND_URL is not set - serving the API only');
    return;
  }
  const target = new URL(frontendUrl);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isBackendPath(req.path)) {
      return next();
    }

    const upstream = httpRequest(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        method: req.method,
        path: req.originalUrl,
        headers: forwardedHeaders(req, req.socket.remoteAddress),
      },
      (answer) => {
        const headers: Record<string, string | string[]> = {};
        for (const [name, value] of Object.entries(answer.headers)) {
          if (value !== undefined && !HOP_BY_HOP.has(name)) {
            headers[name] = value;
          }
        }
        res.writeHead(answer.statusCode ?? 502, headers);
        answer.pipe(res);
      },
    );

    upstream.on('error', (error) => {
      logger.error(`Frontend at ${target.origin} is unreachable: ${error.message}`);
      if (res.headersSent) {
        res.destroy(error);
        return;
      }
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'หน้าเว็บยังไม่พร้อมใช้งาน กรุณาลองใหม่ในอีกสักครู่',
        },
      });
    });

    req.pipe(upstream);
  });

  // WebSocket upgrades (the Next dev server's hot reload) take the same route.
  app
    .getHttpServer()
    .on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
      const path = new URL(req.url ?? '/', 'http://placeholder').pathname;
      if (isBackendPath(path)) {
        return;
      }
      const upstream = connect(Number(target.port) || 80, target.hostname, () => {
        const headers = forwardedHeaders(req, req.socket.remoteAddress);
        const lines = [`${req.method} ${req.url} HTTP/1.1`];
        for (const [name, value] of Object.entries(headers)) {
          for (const v of Array.isArray(value) ? value : [value]) lines.push(`${name}: ${v}`);
        }
        lines.push('connection: Upgrade', `upgrade: ${req.headers.upgrade ?? 'websocket'}`);
        upstream.write(`${lines.join('\r\n')}\r\n\r\n`);
        if (head.length > 0) upstream.write(head);
        upstream.pipe(socket);
        socket.pipe(upstream);
      });
      const close = () => {
        upstream.destroy();
        socket.destroy();
      };
      upstream.on('error', close);
      socket.on('error', close);
    });

  logger.log(`Serving the frontend from ${target.origin}`);
}
