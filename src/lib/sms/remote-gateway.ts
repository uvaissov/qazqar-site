export type RemoteSmsResult = {
  ok: boolean;
  providerId?: string;
  error?: string;
};

const UNLOCK_TEXT = process.env.REMOTE_SMS_UNLOCK_TEXT ?? "OPEN";
const LOCK_TEXT = process.env.REMOTE_SMS_LOCK_TEXT ?? "CLOSE";

export function smsTextFor(action: "UNLOCK" | "LOCK"): string {
  return action === "UNLOCK" ? UNLOCK_TEXT : LOCK_TEXT;
}

export async function sendRemoteSms(
  phone: string,
  text: string,
): Promise<RemoteSmsResult> {
  console.info("[remote-sms][stub]", { phone, text });
  // TODO: подключить реальный SMS-gateway (Mobizon / SMS.kz / свой).
  return { ok: true, providerId: `stub-${Date.now()}` };
}
