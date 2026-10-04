#!/bin/sh
set -e

echo "[entrypoint] applying database migrations ..."
npx prisma migrate deploy

# หน้าเว็บ (Next.js) ฟังเฉพาะใน container — ภายนอกเข้าผ่าน backend ที่ :4235 เท่านั้น
echo "[entrypoint] starting the web frontend on 127.0.0.1:3235"
PORT=3235 HOSTNAME=127.0.0.1 node /app/web/frontend/server.js &

echo "[entrypoint] starting CSMJU Helpdesk"
exec "$@"
