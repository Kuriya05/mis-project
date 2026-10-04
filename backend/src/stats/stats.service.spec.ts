import { weekStartOf } from './stats.service';

const day = (date: Date) => date.toISOString().slice(0, 10);

describe('weekStartOf', () => {
  it('starts weeks on Monday in Thai time', () => {
    // Sunday 4 Oct 2026 23:30 in Bangkok is still the week of Monday 28 Sep
    expect(day(weekStartOf(new Date('2026-10-04T16:30:00Z')))).toBe('2026-09-28');
    // Monday 5 Oct 2026 00:30 in Bangkok, while UTC is still Sunday
    expect(day(weekStartOf(new Date('2026-10-04T17:30:00Z')))).toBe('2026-10-05');
    expect(day(weekStartOf(new Date('2026-10-07T05:00:00Z')))).toBe('2026-10-05');
  });
});
