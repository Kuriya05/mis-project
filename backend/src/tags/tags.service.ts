import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryTagsDto } from './dto/query-tags.dto';

export interface TagView {
  name: string;
  questionCount: number;
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Most used first, then alphabetical — a deterministic order for paging. */
  async findAll(query: QueryTagsDto): Promise<{ items: TagView[]; total: number }> {
    const where: Prisma.TagWhereInput = query.q
      ? { name: { contains: query.q, mode: 'insensitive' } }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        select: { name: true, _count: { select: { questions: true } } },
        orderBy: [{ questions: { _count: 'desc' } }, { name: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({ name: row.name, questionCount: row._count.questions })),
      total,
    };
  }

  /**
   * Tag ids for already-normalised names. An existing tag is reused whatever
   * its letter case, so "react" attaches to "React" instead of forking it.
   */
  async resolveIds(tx: Tx, names: readonly string[]): Promise<string[]> {
    const ids: string[] = [];
    for (const name of names) {
      const existing = await tx.tag.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (existing) {
        ids.push(existing.id);
        continue;
      }
      const created = await tx.tag.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true },
      });
      ids.push(created.id);
    }
    return ids;
  }
}
