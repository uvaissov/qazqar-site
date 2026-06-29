# План деплоя QazQar Site на qazqar.d3v.kz (стейджинг)

## Context

Знакомый (Айдын Сапаргалиев) выдал чистую VM под развёртывание QazQar. Сервер: Ubuntu 24.04 LTS,
Intel N150, **4 vCPU / 4 GB RAM + 4 GB swap / 49 GB SSD** (Proxmox VM, ~46 GB свободно). Docker не
установлен, nginx стоит с дефолтным конфигом на :80. TLS для `qazqar.d3v.kz` терминируется **выше**
(внешний шлюз → VM:80), HTTPS снаружи уже отдаёт 200.

Цель — развернуть `qazqar-site` (Next.js 15 + PostgreSQL + MinIO) как **демо/стейджинг**. В репозитории
сейчас **нет** Dockerfile и прод-compose (текущий `docker-compose.yml` — только инфра для dev, с mailhog).

Решения (согласованы с пользователем):
- Назначение — **демо/стейджинг** (данные не критичны, боевой домен подключим позже).
- **SMS-фича (GSM-шлюз TG100/AMI) — откладываем.** GSM_* переменные не задаём; модуль читает их лениво,
  на старт приложения не влияет (`instrumentation.ts` запускает только синк CRM).
- **Секреты:** генерирую сам (DB-пароль, MinIO-ключи, `JWT_SECRET`); внешние (Yume CRM, SMTP) читаю из
  локального `.env` (доступ на чтение выдан).
- **Харденинг — сразу:** SSH-ключ + отключить вход по паролю, сменить root-пароль, включить ufw.

## Архитектура развёртывания

Всё в Docker Compose на сервере, единый стек:

```
Внешний шлюз (TLS) ──:80──▶ nginx (VM) ──▶ 127.0.0.1:3000  app (Next.js standalone)
                                       └──▶ 127.0.0.1:9002  minio  (location /qazqar-images/)
                              app ──(docker net)──▶ postgres:5432, minio:9000
```

- **app** — Next.js, multi-stage Dockerfile c `output: 'standalone'`. Сборка на сервере (4 GB + swap
  покрывают пик `next build`).
- **postgres** — `postgres:16-alpine`, том `postgres_data`. Публикуется только на `127.0.0.1:5433`.
- **minio** + **minio-init** — как в dev; публикуется на `127.0.0.1:9002`. `mailhog` в прод-стек НЕ входит.
- Приложение — **один инстанс** (в `instrumentation.ts` крутится in-process поллинг CRM каждую минуту;
  несколько реплик = дубли синка).

## Изменения в коде (создать файлы в репозитории; коммитит пользователь отдельно)

1. **`next.config.ts`** — добавить:
   - `output: "standalone"` (для лёгкого рантайм-образа);
   - в `images.remotePatterns` прод-хост картинок: `https://qazqar.d3v.kz/qazqar-images/**`.
   (Сейчас там только `localhost:9002` и `qazqar.kz` — `src/lib/minio.ts:21` отдаёт
   `${NEXT_PUBLIC_MINIO_URL}/${fileName}`.)

2. **`Dockerfile`** (новый, multi-stage):
   - deps → build → runner на `node:22-alpine`;
   - в build-стейдже: `npm ci`, `npx prisma generate` (клиент в `src/generated/prisma`), `npm run build`;
   - **`NEXT_PUBLIC_MINIO_URL` пробросить как build ARG** — `NEXT_PUBLIC_*` инлайнятся на этапе сборки;
   - runner копирует `.next/standalone`, `.next/static`, `public`, плюс `node_modules/.bin` Prisma и
     `prisma/` для `migrate deploy`; запуск `node server.js`.

3. **`.dockerignore`** — `node_modules`, `.next`, `.git`, `.env*`, `docs`, `bruno`.

4. **`docker-compose.prod.yml`** (новый) — сервисы `app`/`postgres`/`minio`/`minio-init`; порты на
   `127.0.0.1`; `env_file: .env`; `app` зависит от healthcheck postgres+minio.

5. **`.env.production.example`** (новый) — шаблон прод-переменных (без значений).

> Перенос на сервер без обязательного коммита: `rsync -az --exclude node_modules --exclude .next
> --exclude .git ./ root@qazqar.d3v.kz:/opt/qazqar/` (через порт 21522). Сборка — на сервере.
> Коммит deploy-файлов в репозиторий — отдельный follow-up пользователя.

## Шаги на сервере

**0. Харденинг (первым делом).**
   - Прочитать локальный публичный ключ (`~/.ssh/*.pub`; если нет — сгенерировать), положить в
     `/root/.ssh/authorized_keys`, проверить вход по ключу.
   - Сменить root-пароль на новый сильный (обновить запись в memory-файле сервера).
   - `sshd`: `PasswordAuthentication no` (порт 21522 оставить), `systemctl restart ssh`.
   - `ufw`: allow `21522/tcp`, `80/tcp`; `ufw enable`.

**1. Docker.** Установить Docker Engine + compose plugin (официальный apt-репозиторий), `systemctl enable --now docker`.

**2. Код.** `mkdir -p /opt/qazqar`, перенести проект (rsync, см. выше).

**3. `.env` (прод) в `/opt/qazqar/.env`:**
   - `DATABASE_URL=postgresql://qazqar:<gen>@postgres:5432/qazqar`
   - `JWT_SECRET=<gen>` , `NODE_ENV=production`
   - MinIO: `MINIO_ENDPOINT=minio`, `MINIO_PORT=9000`, `MINIO_USE_SSL=false`,
     `MINIO_ACCESS_KEY=<gen>`, `MINIO_SECRET_KEY=<gen>`, `MINIO_BUCKET=qazqar-images`,
     `NEXT_PUBLIC_MINIO_URL=https://qazqar.d3v.kz/qazqar-images`
   - Yume CRM (`YUME_API_URL`, `YUME_ORIGIN`, `YUME_USERNAME`, `YUME_PASSWORD`,
     `YUME_INVENTORIZATION_STATE_OK/BROKEN`) и SMTP (`SMTP_HOST/PORT/USER/PASS/FROM`) — из локального `.env`.
   - GSM_* — **не задаём** (SMS отложен).

**4. Сборка и запуск.** `docker compose -f docker-compose.prod.yml build` → `... up -d`.

**5. Миграции и seed.** `docker compose ... exec app npx prisma migrate deploy`; затем seed
   (`admin@qazqar.kz` / `admin123`, скидки) — пароль админа сменить после.

**6. nginx (VM, `/etc/nginx/sites-available/qazqar`, симлинк в sites-enabled, убрать `default`):**
```nginx
server {
  listen 80 default_server;
  server_name qazqar.d3v.kz _;
  client_max_body_size 25m;                       # загрузка фото авто
  location /qazqar-images/ {
    proxy_pass http://127.0.0.1:9002;             # объекты MinIO: /qazqar-images/<file>
    proxy_set_header Host $host;
  }
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;     # TLS терминируется выше
  }
}
```
   `nginx -t && systemctl reload nginx`.

## Риски и на что смотреть

- **Память при `next build`** — если упадёт по OOM, fallback: собрать образ локально и
  `docker save | ssh ... docker load`, либо временно поднять swap.
- **`NEXT_PUBLIC_MINIO_URL` на этапе сборки** — забыть пробросить build ARG = картинки сломаются.
- **DB-доступ во время `next build`** — если какая-то страница тянет БД при сборке, билд упрётся в
  отсутствие Postgres. Проверить в verification; при необходимости пометить такие роуты `dynamic`.
- **SMTP из dev `.env`** — если там mailhog/localhost, OTP-письма (регистрация, сброс пароля) на сервере
  не отправятся. Для стейджинга решить: реальный SMTP или поднять mailhog для тестов. **Открытый вопрос.**

## Verification (end-to-end)

1. `docker compose ps` — все healthy; `docker compose logs app` — старт без ошибок, виден запуск синка CRM.
2. `curl -I https://qazqar.d3v.kz/` → 200; открыть каталог — авто подтянулись из CRM (синк).
3. Залогиниться в `/admin` под `admin@qazqar.kz`; загрузить фото → проверить, что отдаётся по
   `https://qazqar.d3v.kz/qazqar-images/<file>` и рендерится в `next/image`.
4. Пройти OTP-флоу регистрации (если SMTP боевой) — письмо доходит, регистрация создаёт CRM-клиента.
5. Харденинг: `ssh -p 21522` по ключу работает, по паролю — отказ; `ufw status` — только 21522/80.
