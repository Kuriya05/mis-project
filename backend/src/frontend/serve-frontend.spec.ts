import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { isBackendPath, serveFrontend } from './serve-frontend';

@Controller('api')
class PingController {
  @Get('ping')
  ping() {
    return { from: 'backend' };
  }
}

const listen = (server: Server) =>
  new Promise<number>((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port)),
  );

/**
 * Pages come from the Next server but share the backend's origin, so the SSO
 * cookie and redirects keep working. The proxy must leave /api and /auth to Nest
 * and pass everything else through untouched.
 */
describe('serveFrontend', () => {
  let upstream: Server;
  let upstreamPort: number;
  let seen: IncomingMessage[];
  let app: NestExpressApplication;
  let base: string;

  async function boot(frontendUrl: string | null) {
    @Module({
      imports: [ConfigModule.forRoot({ ignoreEnvFile: true, load: [() => ({ frontend: { url: frontendUrl } })] })],
      controllers: [PingController],
    })
    class TestModule {}

    app = await NestFactory.create<NestExpressApplication>(TestModule, { logger: false });
    serveFrontend(app);
    await app.listen(0, '127.0.0.1');
    base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  }

  beforeEach(async () => {
    seen = [];
    upstream = createServer((req, res) => {
      seen.push(req);
      if (req.url === '/moved') {
        res.writeHead(307, { location: '/questions', 'set-cookie': 'a=1; Path=/' });
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-from': 'next' });
      res.end(`<p>${req.method} ${req.url}</p>`);
    });
    upstreamPort = await listen(upstream);
  });

  afterEach(async () => {
    await app?.close();
    await new Promise((resolve) => upstream.close(resolve));
  });

  it('passes page requests, query string included, to the Next server', async () => {
    await boot(`http://127.0.0.1:${upstreamPort}`);

    const res = await fetch(`${base}/questions?tab=mine`, { headers: { cookie: 's=1' } });

    expect(res.status).toBe(200);
    expect(res.headers.get('x-from')).toBe('next');
    expect(await res.text()).toBe('<p>GET /questions?tab=mine</p>');
    expect(seen[0].headers.cookie).toBe('s=1');
    expect(seen[0].headers['x-forwarded-host']).toBe(new URL(base).host);
  });

  it('keeps /api and /auth on the backend', async () => {
    await boot(`http://127.0.0.1:${upstreamPort}`);

    const res = await fetch(`${base}/api/ping`);

    expect(await res.json()).toEqual({ from: 'backend' });
    expect(seen).toHaveLength(0);
  });

  it('returns redirects and cookies from Next as they are, without following them', async () => {
    await boot(`http://127.0.0.1:${upstreamPort}`);

    const res = await fetch(`${base}/moved`, { redirect: 'manual' });

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/questions');
    expect(res.headers.get('set-cookie')).toBe('a=1; Path=/');
  });

  it('does not let the client choose X-Forwarded-For for the Next server', async () => {
    await boot(`http://127.0.0.1:${upstreamPort}`);

    await fetch(`${base}/`, { headers: { 'x-forwarded-for': '6.6.6.6' } });

    expect(seen[0].headers['x-forwarded-for']).not.toContain('6.6.6.6');
  });

  it('answers 503 in the standard envelope when the Next server is down', async () => {
    await new Promise((resolve) => upstream.close(resolve));
    upstream = createServer();
    await boot(`http://127.0.0.1:${upstreamPort}`);

    const res = await fetch(`${base}/questions`);

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ success: false, error: { code: 'SERVICE_UNAVAILABLE' } });
  });

  it('serves the API only when FRONTEND_URL is not set', async () => {
    await boot(null);

    const res = await fetch(`${base}/questions`);

    expect(res.status).toBe(404);
    expect(seen).toHaveLength(0);
  });

  it.each([
    ['/api', true],
    ['/api/v1/questions', true],
    ['/auth/callback', true],
    ['/apis', false],
    ['/authors', false],
    ['/', false],
  ])('treats %s as a backend path: %p', (path, expected) => {
    expect(isBackendPath(path)).toBe(expected);
  });
});
