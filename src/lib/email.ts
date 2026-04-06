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
  type: "REGISTER" | "RESET_PASSWORD"
) {
  const subject =
    type === "REGISTER"
      ? `Qazqar — Код подтверждения: ${code}`
      : `Qazqar — Восстановление пароля: ${code}`;

  const text =
    type === "REGISTER"
      ? `Ваш код для регистрации: ${code}\n\nКод действителен 10 минут.`
      : `Ваш код для восстановления пароля: ${code}\n\nКод действителен 10 минут.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #0891b2; margin-bottom: 8px;">Qazqar</h2>
      <p style="color: #374151; margin-bottom: 24px;">
        ${type === "REGISTER" ? "Код подтверждения для регистрации" : "Код для восстановления пароля"}
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
