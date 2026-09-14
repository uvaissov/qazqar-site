import net from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Фейковый AMI-шлюз: логин + ответ на SMSCommand по сценарию.
let server: net.Server;
let commandReply = "";
let received = "";

async function start(): Promise<number> {
  server = net.createServer((socket) => {
    socket.write("Asterisk Call Manager/1.1\r\n");
    socket.on("data", (chunk) => {
      received += chunk.toString();
      const m = received.match(/ActionID:\s*(\S+)/);
      if (!m || received.includes("__answered__")) return;
      received += "__answered__";
      socket.write("Response: Success\r\nMessage: Authentication accepted\r\n\r\n");
      socket.write(
        `Response: Follows\r\nPrivilege: SMSCommand\r\nActionID: ${m[1]}\r\n${commandReply}--END COMMAND--\r\n\r\n`,
      );
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return (server.address() as net.AddressInfo).port;
}

describe("sendRemoteSms via AMI", () => {
  beforeEach(async () => {
    received = "";
    commandReply = "";
    const port = await start();
    process.env.GSM_GATEWAY_HOST = "127.0.0.1";
    process.env.GSM_GATEWAY_AMI_PORT = String(port);
    process.env.GSM_GATEWAY_ACCOUNT = "apiuser";
    process.env.GSM_GATEWAY_PASSWORD = "apipass";
    process.env.GSM_GATEWAY_TIMEOUT_MS = "1000";
  });

  afterEach(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  it("sends «10» for UNLOCK and «11» for LOCK on span 2", async () => {
    const { sendRemoteSms, smsTextFor } = await import("./remote-gateway");
    expect(smsTextFor("UNLOCK")).toBe("10");
    expect(smsTextFor("LOCK")).toBe("11");

    const res = await sendRemoteSms("+7 705 123 45 67", smsTextFor("UNLOCK"));
    expect(received).toContain('gsm send sms 2 77051234567 "10"');
    expect(res.ok).toBe(true);
    expect(res.providerId).toMatch(/^tg100-ami-/);
  });

  it("fails when the module rejects the command", async () => {
    commandReply = "No GSM running on span 2\r\n";
    const { sendRemoteSms } = await import("./remote-gateway");
    const res = await sendRemoteSms("+77051234567", "11");
    expect(res.ok).toBe(false);
  });

  it("rejects an invalid phone without touching the gateway", async () => {
    const { sendRemoteSms } = await import("./remote-gateway");
    const res = await sendRemoteSms("12345", "10");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("INVALID_PHONE");
    expect(received).toBe("");
  });
});
