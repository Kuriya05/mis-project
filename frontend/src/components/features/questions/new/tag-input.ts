export const MAX_TITLE = 150;
export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 30;

/** `"  #React Native "` -> `"React-Native"` */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").replace(/\s+/g, "-").slice(0, MAX_TAG_LENGTH);
}
