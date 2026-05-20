// SMS-шлюз TG100 (GoIP-аналог) для управления автомобильным пультом.
// API-режим: GET <url>/cgi/WebCGI?1500101&account=…&password=…&port=…&destination=…&content=…
// Дизайн: docs/plans/2026-05-20-gsm-gateway-tg100-design.md
//
// Env:
//   GSM_GATEWAY_URL          — http://192.168.5.150
//   GSM_GATEWAY_ACCOUNT      — API-аккаунт шлюза
//   GSM_GATEWAY_PASSWORD     — API-пароль шлюза
//   GSM_GATEWAY_PORT         — порт SIM (default "1")
//   GSM_GATEWAY_TIMEOUT_MS   — таймаут запроса (default 10000)
//   REMOTE_SMS_UNLOCK_TEXT   — текст SMS для unlock (default "OPEN")
//   REMOTE_SMS_LOCK_TEXT     — текст SMS для lock   (default "CLOSE")

export type RemoteSmsResult = {
  ok: boolean;
  providerId?: string;
  error?: string;
};

const UNLOCK_TEXT = process.env.REMOTE_SMS_UNLOCK_TEXT ?? "OPEN";
const LOCK_TEXT = process.env.REMOTE_SMS_LOCK_TEXT ?? "CLOSE";

const DEFAULT_TIMEOUT_MS = 10_000;
const RESPONSE_TRIM_LIMIT = 256;

export function smsTextFor(action: "UNLOCK" | "LOCK"): string {
  return action === "UNLOCK" ? UNLOCK_TEXT : LOCK_TEXT;
}

export function normalizePhoneForGateway(raw: string): string | null {
  const digits = raw.replace(/\D+/g, "");
  let normalized = digits;
  if (normalized.length === 11 && normalized.startsWith("8")) {
    normalized = "7" + normalized.slice(1);
  } else if (normalized.length === 10) {
    normalized = "7" + normalized;
  }
  if (normalized.length !== 11 || !normalized.startsWith("7")) {
    return null;
  }
  return normalized;
}

export async function sendRemoteSms(
  phone: string,
  text: string,
): Promise<RemoteSmsResult> {
  const destination = normalizePhoneForGateway(phone);
  if (!destination) {
    return { ok: false, error: `INVALID_PHONE: ${phone}` };
  }

  const baseUrl = process.env.GSM_GATEWAY_URL?.trim();
  const account = process.env.GSM_GATEWAY_ACCOUNT?.trim();
  const password = process.env.GSM_GATEWAY_PASSWORD;
  const port = process.env.GSM_GATEWAY_PORT?.trim() || "1";
  const timeoutMs = Number(process.env.GSM_GATEWAY_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  if (!baseUrl || !account || !password) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "GATEWAY_NOT_CONFIGURED" };
    }
    console.warn("[remote-sms] GSM gateway env not set, falling back to stub", {
      phone: destination,
      text,
    });
    return { ok: true, providerId: `stub-${Date.now()}` };
  }

  const params = new URLSearchParams({
    account,
    password,
    port,
    destination,
    content: text,
  });
  const url = `${baseUrl.replace(/\/+$/, "")}/cgi/WebCGI?1500101&${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const bodyRaw = await response.text();
    const body = bodyRaw.trim().slice(0, RESPONSE_TRIM_LIMIT);

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}: ${body}` };
    }
    return {
      ok: true,
      providerId: `tg100-${Date.now()}${body ? `:${body}` : ""}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
