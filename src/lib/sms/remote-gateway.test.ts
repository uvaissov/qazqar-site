import net from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Фейковый AMI-шлюз: отвечает на SMSCommand и (по сценарию) шлёт ReceivedSMS.
type Scenario = {
  commandReply?: string;
  events?: string[];
  delayMs?: number;
};

let server: net.Server;
let scenario: Scenario = {};
let received = "";

const ucs2 = (s: string) =>
  Array.from(s, (ch) => ch.charCodeAt(0).toString(16).padStart(4, "0")).join("");

async function start(): Promise<number> {
  server = net.createServer((socket) => {
    socket.write("Asterisk Call Manager/1.1\r\n");
    socket.on("data", (chunk) => {
      received += chunk.toString();
      const m = received.match(/ActionID:\s*(\S+)/);
      if (!m || received.includes("__answered__")) return;
      received += "__answered__";
      const actionId = m[1];
      socket.write(
        "Response: Success\r\nMessage: Authentication accepted\r\n\r\n",
      );
      const body = scenario.commandReply ?? "";
      socket.write(
        `Response: Follows\r\nPrivilege: Command\r\nActionID: ${actionId}\r\n${body}--END COMMAND--\r\n\r\n`,
      );
      for (const ev of scenario.events ?? []) {
        setTimeout(() => socket.write(ev), scenario.delayMs ?? 20);
      }
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return (server.address() as net.AddressInfo).port;
}

function event(sender: string, content: string) {
  return (
    `Event: ReceivedSMS\r\nPrivilege: all,smscommand\r\nGsmSpan: 2\r\n` +
    `Sender: ${sender}\r\nRecvtime: 2026-09-14 13:11:20\r\nIndex: 1\r\nTotal: 1\r\n` +
    `Content: ${content}\r\n\r\n`
  );
}

async function load() {
  // env читается на уровне модуля — импортируем после настройки.
  const mod = await import("./remote-gateway");
  return mod;
}

describe("sendRemoteSms via AMI", () => {
  beforeEach(async () => {
    received = "";
    scenario = {};
    const port = await start();
    process.env.GSM_GATEWAY_HOST = "127.0.0.1";
    process.env.GSM_GATEWAY_AMI_PORT = String(port);
    process.env.GSM_GATEWAY_ACCOUNT = "apiuser";
    process.env.GSM_GATEWAY_PASSWORD = "apipass";
    process.env.GSM_GATEWAY_TIMEOUT_MS = "1000";
    process.env.REMOTE_SMS_CONFIRM_TIMEOUT_MS = "300";
  });

  afterEach(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  it("sends «10» for UNLOCK and confirms on «Замки откр.»", async () => {
    scenario.events = [event("+77051234567", "4G:31(A) GPS:- Охрана выкл. Замки откр.")];
    const { sendRemoteSms } = await load();
    const res = await sendRemoteSms("+7 705 123 45 67", "UNLOCK");
    expect(received).toContain('gsm send sms 2 77051234567 "10"');
    expect(res.ok).toBe(true);
    expect(res.confirmed).toBe(true);
    expect(res.reply).toContain("Замки откр.");
  });

  it("sends «11» for LOCK, decodes UCS-2 hex reply", async () => {
    scenario.events = [event("77051234567", ucs2("Охрана вкл. Замки закр."))];
    const { sendRemoteSms } = await load();
    const res = await sendRemoteSms("+77051234567", "LOCK");
    expect(received).toContain('"11"');
    expect(res.confirmed).toBe(true);
    expect(res.reply).toBe("Охрана вкл. Замки закр.");
  });

  it("ignores replies from other numbers and non-matching text, keeps ok", async () => {
    scenario.events = [
      event("+77000000000", "Замки откр."),
      event("+77051234567", "06.02.06 12:43:00 Тревога!"),
    ];
    const { sendRemoteSms } = await load();
    const res = await sendRemoteSms("+77051234567", "UNLOCK");
    expect(res.ok).toBe(true);
    expect(res.confirmed).toBe(false);
    expect(res.reply).toContain("Тревога!");
  });

  it("does not confirm LOCK with an unlock reply", async () => {
    scenario.events = [event("+77051234567", "Охрана выкл. Замки откр.")];
    const { sendRemoteSms } = await load();
    const res = await sendRemoteSms("+77051234567", "LOCK");
    expect(res.ok).toBe(true);
    expect(res.confirmed).toBe(false);
  });

  it("fails when the module rejects the command", async () => {
    scenario.commandReply = "No GSM running on span 2\r\n";
    const { sendRemoteSms } = await load();
    const res = await sendRemoteSms("+77051234567", "UNLOCK");
    expect(res.ok).toBe(false);
    expect(res.confirmed).toBe(false);
  });
});
