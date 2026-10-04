# ---------- build stage ----------
# build context คือ "รากของ repo" เพราะ pnpm workspace เก็บ lockfile ไว้ที่ราก
#   docker build -f backend/Dockerfile .
# image เดียวให้บริการทั้ง API และหน้าเว็บ (Next.js standalone) บน origin เดียวกัน:
# backend รับทุก request ที่ :4235 แล้วส่งหน้าเว็บต่อให้ Next server ที่ 127.0.0.1:3235
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY backend/prisma backend/prisma
COPY backend/prisma.config.ts backend/prisma.config.ts
RUN pnpm install --frozen-lockfile

COPY backend/ backend/
COPY frontend/ frontend/
RUN pnpm --filter frontend build \
 && pnpm --filter backend exec prisma generate \
 && pnpm --filter backend build

# ---------- runtime stage ----------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --prod --filter backend... --ignore-scripts \
 && pnpm store prune

# dist/ มีทั้งโค้ดที่ compile แล้ว (dist/src) และ Prisma client (dist/generated/prisma)
COPY --from=builder /app/backend/dist ./backend/dist
# Next.js standalone: server.js + node_modules ที่ trace แล้ว, static และ public ต้อง copy เอง
COPY --from=builder /app/frontend/.next/standalone ./web
COPY --from=builder /app/frontend/.next/static ./web/frontend/.next/static
COPY --from=builder /app/frontend/public ./web/frontend/public
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts
COPY backend/docker/entrypoint.sh ./backend/docker/entrypoint.sh

RUN chmod +x ./backend/docker/entrypoint.sh && chown -R node:node /app
USER node
WORKDIR /app/backend

ENV PORT=4235 \
    FRONTEND_URL=http://127.0.0.1:3235 \
    BACKEND_URL=http://127.0.0.1:4235
EXPOSE 4235

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
