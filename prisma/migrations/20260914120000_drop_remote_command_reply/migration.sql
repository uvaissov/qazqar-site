-- Откат подтверждения SMS-команды: прошивка TG100 входящие SMS не принимает,
-- ждать ответ пульта бессмысленно. Колонки из 20260914100000 убираем.
ALTER TABLE "remote_commands" DROP COLUMN IF EXISTS "replyText";
ALTER TABLE "remote_commands" DROP COLUMN IF EXISTS "confirmedAt";
