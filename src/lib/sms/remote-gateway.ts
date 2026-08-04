// SMS-шлюз TG100 (Asterisk-based) для управления автомобильным пультом.
// Транспорт: AMI (Asterisk Manager Interface), TCP-порт 5038.
//   Login → Action: SMSCommand "gsm send sms <span> <phone> \"<text>\"" → Logoff
// Дизайн: docs/plans/2026-05-20-gsm-gateway-tg100-design.md
//
// Почему AMI, а не WebCGI: inline-вызов WebCGI `1500101` на этой прошивке
// отбивается (отдаёт HTML `onLogout` c HTTP 200) и SMS не отправляет. AMI с теми
// же кредами реально доставляет. Рабочий GSM-span = 2 (1/3/4 → "No GSM running").
// Проверено на железе 2026-06-10.
//
// Env:
//   GSM_GATEWAY_HOST         — IP/хост шлюза (если пусто — берётся из GSM_GATEWAY_URL)
//   GSM_GATEWAY_URL          — http://192.168.5.150 (legacy, используется только для хоста)
//   GSM_GATEWAY_ACCOUNT      — AMI-пользователь (apiuser)
//   GSM_GATEWAY_PASSWORD     — AMI-пароль (apipass)
//   GSM_GATEWAY_AMI_PORT     — TCP-порт AMI (default 5038)
//   GSM_GATEWAY_SPAN         — GSM-span с SIM (default "2")
//   GSM_GATEWAY_TIMEOUT_MS   — таймаут всей операции (default 10000)
//   REMOTE_SMS_UNLOCK_TEXT   — текст SMS для unlock (default "OPEN")
//   REMOTE_SMS_LOCK_TEXT     — текст SMS для lock   (default "CLOSE")

import net from "node:net";
import { normalizePhone } from "@/lib/phone";

export type RemoteSmsResult = {
  ok: boolean;
  providerId?: string;
  error?: string;
};

const UNLOCK_TEXT = process.env.REMOTE_SMS_UNLOCK_TEXT ?? "OPEN";
const LOCK_TEXT = process.env.REMOTE_SMS_LOCK_TEXT ?? "CLOSE";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_AMI_PORT = 5038;
const DEFAULT_SPAN = "2";
const RESPONSE_TRIM_LIMIT = 256;

export function smsTextFor(action: "UNLOCK" | "LOCK"): string {
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

type AmiOutcome = {
  ok: boolean;
  raw: string;
  error?: string;
};

// Одна короткоживущая AMI-сессия: коннект → Login → SMSCommand → читаем
// блок ответа до "--END COMMAND--" → Logoff. Возвращаем сырой блок ответа.
function amiSendSms(params: {
  host: string;
  port: number;
  username: string;
  password: string;
  span: string;
  phone: string;
  text: string;
  timeoutMs: number;
}): Promise<AmiOutcome> {
  const { host, port, username, password, span, phone, text, timeoutMs } = params;

  return new Promise((resolve) => {
    const actionId = `qz-${Date.now()}`;
    let buf = "";
    let settled = false;

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

    const timer = setTimeout(
      () => finish({ ok: false, raw: buf, error: "AMI_TIMEOUT" }),
      timeoutMs,
    );

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      const login =
        `Action: Login\r\nUsername: ${username}\r\nSecret: ${password}\r\n` +
        `Events: off\r\n\r\n`;
      const send =
        `Action: SMSCommand\r\nActionID: ${actionId}\r\n` +
        `Command: gsm send sms ${span} ${phone} "${text}"\r\n\r\n`;
      socket.write(login + send);
    });

    socket.on("data", (chunk) => {
      buf += chunk.toString("utf8");

      if (/Response:\s*Error[\s\S]*Authentication failed/i.test(buf)) {
        finish({ ok: false, raw: buf, error: "AMI_AUTH_FAILED" });
        return;
      }

      const idx = buf.indexOf(`ActionID: ${actionId}`);
      if (idx === -1) return;
      const block = buf.slice(idx);
      if (!block.includes("--END COMMAND--")) return;

      const body = block.split("--END COMMAND--")[0];
      // "No GSM running on span N" или "Command '...' failed." = SMS НЕ ушло.
      const failed = /No GSM running|failed/i.test(body);
      finish({ ok: !failed, raw: body });
    });

    socket.on("timeout", () =>
      finish({ ok: false, raw: buf, error: "AMI_TIMEOUT" }),
    );
    socket.on("error", (err) =>
      finish({ ok: false, raw: buf, error: err.message }),
    );
    socket.on("close", () =>
      finish({ ok: false, raw: buf, error: "AMI_CLOSED" }),
    );
  });
}

export async function sendRemoteSms(
  phone: string,
  text: string,
): Promise<RemoteSmsResult> {
  const destination = normalizePhoneForGateway(phone);
  if (!destination) {
    return { ok: false, error: `INVALID_PHONE: ${phone}` };
  }

  const host = resolveHost();
  const username = process.env.GSM_GATEWAY_ACCOUNT?.trim();
  const password = process.env.GSM_GATEWAY_PASSWORD;
  const port = Number(process.env.GSM_GATEWAY_AMI_PORT) || DEFAULT_AMI_PORT;
  const span = process.env.GSM_GATEWAY_SPAN?.trim() || DEFAULT_SPAN;
  const timeoutMs = Number(process.env.GSM_GATEWAY_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  if (!host || !username || !password) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "GATEWAY_NOT_CONFIGURED" };
    }
    console.warn("[remote-sms] GSM gateway env not set, falling back to stub", {
      phone: destination,
      text,
    });
    return { ok: true, providerId: `stub-${Date.now()}` };
  }

  const outcome = await amiSendSms({
    host,
    port,
    username,
    password,
    span,
    phone: destination,
    text: sanitizeSmsText(text),
    timeoutMs,
  });

  const trimmed = outcome.raw.trim().slice(0, RESPONSE_TRIM_LIMIT);

  if (!outcome.ok) {
    return { ok: false, error: outcome.error ?? trimmed ?? "AMI_SEND_FAILED" };
  }
  return {
    ok: true,
    providerId: `tg100-ami-${Date.now()}${trimmed ? `:${trimmed}` : ""}`,
  };
}
