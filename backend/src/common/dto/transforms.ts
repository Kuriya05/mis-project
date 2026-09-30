import { Transform } from 'class-transformer';

export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** Query strings only carry text: accept exactly "true" / "false". */
export const QueryBoolean = () =>
  Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value));

/** At least one non-whitespace character. */
export const NOT_BLANK = /\S/;
