-- Подтверждение SMS-команды на автопульт: пульт отвечает SMS
-- («Охрана выкл. Замки откр.» / «Охрана вкл. Замки закр.»), шлюз отдаёт её
-- событием ReceivedSMS. replyText — последний ответ в окне ожидания,
-- confirmedAt — момент, когда ответ распознан как подтверждение команды.
ALTER TABLE "remote_commands" ADD COLUMN "replyText" TEXT;
ALTER TABLE "remote_commands" ADD COLUMN "confirmedAt" TIMESTAMP(3);
