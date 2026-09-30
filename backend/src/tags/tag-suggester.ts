const RULES: ReadonlyArray<{ tag: string; keywords: readonly string[] }> = [
  { tag: 'Java', keywords: ['java', 'spring', 'jvm'] },
  {
    tag: 'Database',
    keywords: ['database', 'sql', 'mongo', 'mysql', 'postgres', 'db', 'refused', 'typeorm', 'prisma'],
  },
  { tag: 'Error', keywords: ['error', 'exception', 'bug', 'fail', 'refused', 'crash'] },
  { tag: 'NestJS', keywords: ['nest', 'nestjs', 'typeorm'] },
  { tag: 'React', keywords: ['react', 'useeffect', 'usestate', 'hooks', 'nextjs'] },
  {
    tag: 'Curriculum',
    keywords: ['หลักสูตร', 'curriculum', 'หน่วยกิต', 'cwie', '2570', 'รหัส 70', 'รหัส70'],
  },
];

export const FALLBACK_TAG = 'General';

/** Keyword-based tag guess for a question; always returns at least one tag. */
export function suggestTags(title: string, body: string): string[] {
  const text = `${title} ${body}`.toLowerCase();
  const tags = RULES.filter((rule) => rule.keywords.some((keyword) => text.includes(keyword))).map(
    (rule) => rule.tag,
  );
  return tags.length > 0 ? tags : [FALLBACK_TAG];
}
