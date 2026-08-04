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

/**
 * Письмо с кодом подтверждения.
 *
 * Вёрстка табличная и с полным HTML-каркасом не из любви к 2005 году: клиенты
 * вроде Spark пропускают через свой нормализатор кусок разметки без <html>, и
 * часть inline-стилей (фон плашки, размер цифр) теряется — заголовок при этом
 * остаётся цветным, из-за чего письмо выглядит наполовину развалившимся.
 *
 * Цвета заданы явно на каждом элементе, плюс объявлена светлая цветовая схема:
 * иначе в тёмной теме клиент перекрашивает фон сам и плашка сливается с ним.
 */
function renderOtpEmail(title: string, code: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f6f7f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7f9;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="440" cellpadding="0" cellspacing="0" border="0" style="width:440px; max-width:100%; background-color:#ffffff; border-radius:16px;">
        <tr>
          <td style="padding:32px 32px 8px 32px; font-family:Arial,Helvetica,sans-serif; font-size:22px; font-weight:bold; color:#0891b2;">
            Qazqar
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px 32px; font-family:Arial,Helvetica,sans-serif; font-size:16px; color:#374151;">
            ${title}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6; border-radius:12px;">
              <tr>
                <td align="center" style="padding:24px; font-family:Arial,Helvetica,sans-serif; font-size:32px; font-weight:bold; letter-spacing:8px; color:#111827;">
                  ${code}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px 32px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#9ca3af;">
            Код действителен 10 минут.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

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

  const html = renderOtpEmail(l.html, code);

  await transport.sendMail({
    from: FROM,
    to: email,
    subject,
    text,
    html,
  });
}
