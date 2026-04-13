import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false,
  ...(process.env.SMTP_USER && {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  }),
});

const FROM = process.env.SMTP_FROM || "noreply@qazqar.kz";

export async function sendOtpEmail(
  email: string,
  code: string,
  type: "REGISTER" | "RESET_PASSWORD" | "LOGIN"
) {
  const labels: Record<typeof type, { subject: string; text: string; html: string }> = {
    REGISTER: {
      subject: `Qazqar — Код подтверждения: ${code}`,
      text: `Ваш код для регистрации: ${code}`,
      html: "Код подтверждения для регистрации",
    },
    RESET_PASSWORD: {
      subject: `Qazqar — Восстановление пароля: ${code}`,
      text: `Ваш код для восстановления пароля: ${code}`,
      html: "Код для восстановления пароля",
    },
    LOGIN: {
      subject: `Qazqar — Одноразовый код для входа: ${code}`,
      text: `Ваш одноразовый код для входа: ${code}`,
      html: "Одноразовый код для входа",
    },
  };

  const l = labels[type];

  const subject = l.subject;
  const text = `${l.text}\n\nКод действителен 10 минут.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #0891b2; margin-bottom: 8px;">Qazqar</h2>
      <p style="color: #374151; margin-bottom: 24px;">
        ${l.html}
      </p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${code}</span>
      </div>
      <p style="color: #9ca3af; font-size: 14px;">Код действителен 10 минут.</p>
    </div>
  `;

  await transport.sendMail({
    from: FROM,
    to: email,
    subject,
    text,
    html,
  });
}
