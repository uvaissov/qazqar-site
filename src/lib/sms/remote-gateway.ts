// SMS-шлюз TG100 (Asterisk-based) для управления автомобильным пультом.
// Транспорт: AMI (Asterisk Manager Interface), TCP-порт 5038.
//   Login → Action: SMSCommand "gsm send sms <span> <phone> \"<text>\""
//         → (опционально) ждём Event: ReceivedSMS с ответом пульта → Logoff
// Дизайн: docs/plans/2026-05-20-gsm-gateway-tg100-design.md
//
// Почему AMI, а не WebCGI: inline-вызов WebCGI `1500101` на этой прошивке
// отбивается (отдаёт HTML `onLogout` c HTTP 200) и SMS не отправляет. AMI с теми
// же кредами реально доставляет. Рабочий GSM-span = 2 (1/3/4 → "No GSM running").
// Проверено на железе 2026-06-10.
//
// Команды пульта (проверено на машине 2026-09-14): «10» — снять с охраны и
// открыть замки, «11» — поставить на охрану и закрыть. После выполнения пульт
// отвечает SMS вида «4G:31(A) GPS:- Охрана выкл. Замки откр.» /
// «... Охрана вкл. Замки закр.» — этот ответ считаем подтверждением.
//
// Env:
//   GSM_GATEWAY_HOST             — IP/хост шлюза (если пусто — берётся из GSM_GATEWAY_URL)
//   GSM_GATEWAY_URL              — http://192.168.5.150 (legacy, используется только для хоста)
//   GSM_GATEWAY_ACCOUNT          — AMI-пользователь (apiuser)
//   GSM_GATEWAY_PASSWORD         — AMI-пароль (apipass)
//   GSM_GATEWAY_AMI_PORT         — TCP-порт AMI (default 5038)
//   GSM_GATEWAY_SPAN             — GSM-span с SIM (default "2")
//   GSM_GATEWAY_TIMEOUT_MS       — таймаут отправки (default 10000)
//   REMOTE_SMS_CONFIRM_TIMEOUT_MS — сколько ждать ответ пульта после отправки
//                                  (default 20000; 0 — не ждать)
//   REMOTE_SMS_UNLOCK_TEXT       — текст SMS для unlock (default "10")
//   REMOTE_SMS_LOCK_TEXT         — текст SMS для lock   (default "11")

import net from "node:net";
import { normalizePhone } from "@/lib/phone";

export type RemoteAction = "UNLOCK" | "LOCK";

export type RemoteSmsResult = {
  ok: boolean;
  providerId?: string;
  error?: string;
  // Пульт прислал SMS, подтверждающую именно эту команду (замки откр./закр.).
  confirmed: boolean;
  // Последний ответ пульта в окне ожидания (даже если он не распознан).
  reply?: string;
};

const UNLOCK_TEXT = process.env.REMOTE_SMS_UNLOCK_TEXT ?? "10";
const LOCK_TEXT = process.env.REMOTE_SMS_LOCK_TEXT ?? "11";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_CONFIRM_TIMEOUT_MS = 20_000;
const DEFAULT_AMI_PORT = 5038;
const DEFAULT_SPAN = "2";
const RESPONSE_TRIM_LIMIT = 256;
const REPLY_TRIM_LIMIT = 512;

// Фразы в ответе пульта, по которым команда считается выполненной.
const CONFIRM_PATTERN: Record<RemoteAction, RegExp> = {
  UNLOCK: /замки\s*откр/i,
  LOCK: /замки\s*закр/i,
};

export function smsTextFor(action: RemoteAction): string {
  return action === "UNLOCK" ? UNLOCK_TEXT : LOCK_TEXT;
}

// Шлюзу нужен номер без ведущего «+»: «77051023353».
function normalizePhoneForGateway(raw: string): string | null {
  const result = normalizePhone(raw, { resident: true });
  return result.ok ? result.phone.slice(1) : null;
}

// Текст SMS уходит внутрь AMI-команды в кавычках. Убираем то, что ломает
// протокол (CR/LF) или закрывает кавычку, и ограничиваем длину.
function sanitizeSmsText(text: string): string {
  return text.replace(/[\r\n"]+/g, " ").trim().slice(0, 160);
}

function resolveHost(): string | null {
  const explicit = process.env.GSM_GATEWAY_HOST?.trim();
  if (explicit) return explicit;
  const url = process.env.GSM_GATEWAY_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname || null;
  } catch {
    // GSM_GATEWAY_URL без схемы — берём как есть
    return url.replace(/^.*?:\/\//, "").replace(/[/:].*$/, "") || null;
  }
}

// Сравниваем номера по последним 10 цифрам: шлюз может отдать отправителя
// как «+77051023353», «77051023353» или «87051023353».
function samePhone(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "").slice(-10);
  const db = b.replace(/\D/g, "").slice(-10);
  return da.length === 10 && da === db;
}

// Кириллицу шлюз может отдать как hex UCS-2 («041E0445...»). Если строка
// целиком hex и кратна 4 — декодируем, иначе возвращаем как есть.
export function decodeSmsContent(raw: string): string {
  const s = raw.trim();
  if (s.length >= 8 && s.length % 4 === 0 && /^[0-9A-Fa-f]+$/.test(s)) {
    let out = "";
    for (let i = 0; i < s.length; i += 4) {
      out += String.fromCharCode(parseInt(s.slice(i, i + 4), 16));
    }
    return out;
  }
  return s;
}

function amiHeader(block: string, name: string): string | null {
  const m = block.match(new RegExp(`^${name}:\\s*(.*)$`, "im"));
  return m ? m[1].trim() : null;
}

type AmiOutcome = {
  ok: boolean;
  raw: string;
  error?: string;
  confirmed: boolean;
  reply?: string;
};

// Одна короткоживущая AMI-сессия: коннект → Login → SMSCommand → читаем
// блок ответа до "--END COMMAND--" → ждём Event: ReceivedSMS от пульта
// (если confirmTimeoutMs > 0) → Logoff.
function amiSendSms(params: {
  host: string;
  port: number;
  username: string;
  password: string;
  span: string;
  phone: string;
  text: string;
  timeoutMs: number;
  confirmTimeoutMs: number;
  confirmPattern: RegExp;
}): Promise<AmiOutcome> {
  const {
    host,
    port,
    username,
    password,
    span,
    phone,
    text,
    timeoutMs,
    confirmTimeoutMs,
    confirmPattern,
  } = params;

  return new Promise((resolve) => {
    const actionId = `qz-${Date.now()}`;
    let buf = "";
    let settled = false;
    // Ответ SMSCommand уже получен, SMS ушла — дальше только ждём подтверждение.
    let sentRaw: string | null = null;
    let lastReply: string | undefined;
    let timer: NodeJS.Timeout;

    const socket = net.createConnection({ host, port });

    const finish = (outcome: AmiOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.write("Action: Logoff\r\n\r\n");
      } catch {
        // сокет уже мог упасть — игнорируем
      }
      socket.destroy();
      resolve(outcome);
    };

    // После успешной отправки любой обрыв — не ошибка команды, а лишь
    // отсутствие подтверждения.
    const abort = (error: string) => {
      if (sentRaw !== null) {
        finish({ ok: true, raw: sentRaw, confirmed: false, reply: lastReply });
      } else {
        finish({ ok: false, raw: buf, error, confirmed: false });
      }
    };

    timer = setTimeout(() => abort("AMI_TIMEOUT"), timeoutMs);
    socket.setTimeout(timeoutMs + confirmTimeoutMs);

    socket.on("connect", () => {
      // События нужны только ради ReceivedSMS — иначе глушим шум.
      const events = confirmTimeoutMs > 0 ? "on" : "off";
      const login =
        `Action: Login\r\nUsername: ${username}\r\nSecret: ${password}\r\n` +
        `Events: ${events}\r\n\r\n`;
      const send =
        `Action: SMSCommand\r\nActionID: ${actionId}\r\n` +
        `Command: gsm send sms ${span} ${phone} "${text}"\r\n\r\n`;
      socket.write(login + send);
    });

    const onCommandResponse = (block: string) => {
      const body = block.split("--END COMMAND--")[0];
      // "No GSM running on span N" или "Command '...' failed." = SMS НЕ ушло.
      if (/No GSM running|failed/i.test(body)) {
        finish({ ok: false, raw: body, confirmed: false });
        return;
      }
      if (confirmTimeoutMs <= 0) {
        finish({ ok: true, raw: body, confirmed: false });
        return;
      }
      sentRaw = body;
      clearTimeout(timer);
      timer = setTimeout(() => abort("CONFIRM_TIMEOUT"), confirmTimeoutMs);
    };

    const onEvent = (block: string) => {
      if (sentRaw === null) return;
      if (!/^Event:\s*ReceivedSMS/im.test(block)) return;
      const sender = amiHeader(block, "Sender");
      const content = amiHeader(block, "Content");
      if (!sender || content == null || !samePhone(sender, phone)) return;
      lastReply = decodeSmsContent(content).slice(0, REPLY_TRIM_LIMIT);
      if (confirmPattern.test(lastReply)) {
        finish({ ok: true, raw: sentRaw, confirmed: true, reply: lastReply });
      }
    };

    socket.on("data", (chunk) => {
      buf += chunk.toString("utf8");

      // AMI-пакеты разделены пустой строкой. Хвост без разделителя оставляем
      // до следующего чанка — кроме блока команды: у него свой терминатор.
      const parts = buf.split("\r\n\r\n");
      const tail = parts.pop() ?? "";
      if (tail.includes("--END COMMAND--")) {
        parts.push(tail);
        buf = "";
      } else {
        buf = tail;
      }

      for (const block of parts) {
        if (settled) return;
        if (/Authentication failed/i.test(block)) {
          abort("AMI_AUTH_FAILED");
          return;
        }
        if (block.includes(`ActionID: ${actionId}`)) {
          if (block.includes("--END COMMAND--")) {
            onCommandResponse(block);
          } else if (/^Response:\s*Error/im.test(block)) {
            // Например, «Permission denied» — команда до модуля не дошла.
            finish({
              ok: false,
              raw: block,
              error: amiHeader(block, "Message") ?? "AMI_ERROR",
              confirmed: false,
            });
          }
          continue;
        }
        onEvent(block);
      }
    });

    socket.on("timeout", () => abort("AMI_TIMEOUT"));
    socket.on("error", (err) => abort(err.message));
    socket.on("close", () => abort("AMI_CLOSED"));
  });
}

export async function sendRemoteSms(
  phone: string,
  action: RemoteAction,
): Promise<RemoteSmsResult> {
  const destination = normalizePhoneForGateway(phone);
  if (!destination) {
    return { ok: false, error: `INVALID_PHONE: ${phone}`, confirmed: false };
  }

  const host = resolveHost();
  const username = process.env.GSM_GATEWAY_ACCOUNT?.trim();
  const password = process.env.GSM_GATEWAY_PASSWORD;
  const port = Number(process.env.GSM_GATEWAY_AMI_PORT) || DEFAULT_AMI_PORT;
  const span = process.env.GSM_GATEWAY_SPAN?.trim() || DEFAULT_SPAN;
  const timeoutMs = Number(process.env.GSM_GATEWAY_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const confirmEnv = process.env.REMOTE_SMS_CONFIRM_TIMEOUT_MS;
  const confirmTimeoutMs =
    confirmEnv == null || confirmEnv === ""
      ? DEFAULT_CONFIRM_TIMEOUT_MS
      : Math.max(0, Number(confirmEnv) || 0);
  const text = sanitizeSmsText(smsTextFor(action));

  if (!host || !username || !password) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "GATEWAY_NOT_CONFIGURED", confirmed: false };
    }
    console.warn("[remote-sms] GSM gateway env not set, falling back to stub", {
      phone: destination,
      text,
    });
    return { ok: true, providerId: `stub-${Date.now()}`, confirmed: false };
  }

  const outcome = await amiSendSms({
    host,
    port,
    username,
    password,
    span,
    phone: destination,
    text,
    timeoutMs,
    confirmTimeoutMs,
    confirmPattern: CONFIRM_PATTERN[action],
  });

  const trimmed = outcome.raw.trim().slice(0, RESPONSE_TRIM_LIMIT);

  if (!outcome.ok) {
    return {
      ok: false,
      error: outcome.error ?? trimmed ?? "AMI_SEND_FAILED",
      confirmed: false,
    };
  }
  return {
    ok: true,
    providerId: `tg100-ami-${Date.now()}${trimmed ? `:${trimmed}` : ""}`,
    confirmed: outcome.confirmed,
    reply: outcome.reply,
  };
}
