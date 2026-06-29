# QazQar Site — single-stage образ для стейджинга.
# next start + prisma migrate deploy на старте. Полный node_modules (нужен для
# prisma CLI и tsx-сида). Debian-база (glibc) — стабильнее Prisma-движков, чем alpine.
FROM node:22-bookworm-slim

WORKDIR /app

# Зависимости (кэш-слой) — нужен и prisma.config.ts, и схема для postinstall/generate.
# npm install (не ci): хост и контейнер используют разные версии npm, из-за чего
# package-lock.json у них рассинхронизируется; install примиряет дерево версией из образа.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund

# Исходники
COPY . .

# NEXT_PUBLIC_* инлайнятся на этапе сборки → пробрасываем как build ARG
ARG NEXT_PUBLIC_MINIO_URL
ENV NEXT_PUBLIC_MINIO_URL=$NEXT_PUBLIC_MINIO_URL

# Build-time заглушки: auth.ts/middleware.ts кидают ошибку при загрузке без JWT_SECRET,
# а Next на этапе "Collecting page data" импортирует все роуты. На рантайме эти значения
# перекрываются env_file с настоящими (container env > image ENV).
ENV JWT_SECRET=build-time-placeholder-overridden-at-runtime
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

# Генерация Prisma-клиента (в src/generated/prisma) и сборка Next
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# На старте: накатить миграции, затем поднять Next
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
