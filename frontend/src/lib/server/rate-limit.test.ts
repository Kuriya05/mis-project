import { describe, expect, it } from "vitest";
import { consume } from "./rate-limit";

describe("rate limit", () => {
  it("allows up to the limit inside the window, then asks to wait", () => {
    const key = `test-${Math.random()}`;
    expect(consume(key, 2, 60_000, 1_000).ok).toBe(true);
    expect(consume(key, 2, 60_000, 2_000).ok).toBe(true);
    expect(consume(key, 2, 60_000, 3_000)).toEqual({ ok: false, retryAfterSec: 58 });
  });

  it("counts again once the window has moved on", () => {
    const key = `test-${Math.random()}`;
    consume(key, 1, 60_000, 0);
    expect(consume(key, 1, 60_000, 30_000).ok).toBe(false);
    expect(consume(key, 1, 60_000, 60_001).ok).toBe(true);
  });

  it("keeps users apart", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    consume(a, 1, 60_000, 0);
    expect(consume(b, 1, 60_000, 0).ok).toBe(true);
  });
});
