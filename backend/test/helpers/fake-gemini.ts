import { AddressInfo } from 'net';
import { IncomingMessage, Server, ServerResponse, createServer } from 'http';

/** What the fake answers, given the prompt the subsystem sent. */
export type GeminiBehaviour =
  | { kind: 'verdict'; verdict: (prompt: Record<string, unknown>) => Record<string, unknown> }
  | { kind: 'status'; status: number };

export interface GeminiCall {
  model: string;
  apiKey: string | undefined;
  /** The parsed JSON the subsystem put in the user turn. */
  prompt: Record<string, unknown>;
  rawBody: string;
}

/**
 * A stand-in for the Gemini generateContent endpoint
 * (POST /models/<model>:generateContent), so the e2e suite never calls Google.
 */
export class FakeGemini {
  private server?: Server;
  behaviour: GeminiBehaviour = { kind: 'status', status: 503 };
  calls: GeminiCall[] = [];

  async start(): Promise<void> {
    this.server = createServer((req, res) => void this.handle(req, res));
    await new Promise<void>((resolve) => this.server!.listen(0, '127.0.0.1', resolve));
  }

  get url(): string {
    return `http://127.0.0.1:${(this.server!.address() as AddressInfo).port}`;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const model = /\/models\/([^:]+):generateContent$/.exec(req.url ?? '')?.[1] ?? '';
    const body = JSON.parse(rawBody) as { contents: { parts: { text: string }[] }[] };
    const prompt = JSON.parse(body.contents[0].parts[0].text) as Record<string, unknown>;
    this.calls.push({ model, apiKey: req.headers['x-goog-api-key'] as string | undefined, prompt, rawBody });

    if (this.behaviour.kind === 'status') {
      res.writeHead(this.behaviour.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { code: this.behaviour.status } }));
      return;
    }
    const text = JSON.stringify(this.behaviour.verdict(prompt));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }));
  }

  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => this.server!.close(() => resolve()));
      this.server = undefined;
    }
  }
}
