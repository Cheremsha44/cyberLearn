const nodemailer = require('nodemailer');

let cachedTransporter = null;

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!cachedTransporter) {
    const auth =
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined;

    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth
    });
  }

  return cachedTransporter;
}

async function sendPasswordResetEmail({ to, username, resetUrl, expiresInMinutes }) {
  const subject = 'Сброс пароля CyberLearn';
  const text = [
    `Здравствуйте, ${username || 'пользователь'}!`,
    '',
    'Вы запросили сброс пароля для аккаунта CyberLearn.',
    `Ссылка действует ${expiresInMinutes} минут.`,
    '',
    `Ссылка для сброса: ${resetUrl}`,
    '',
    'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.'
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 16px;">Сброс пароля CyberLearn</h2>
      <p>Здравствуйте, ${username || 'пользователь'}.</p>
      <p>Вы запросили сброс пароля для аккаунта CyberLearn.</p>
      <p>Ссылка действует <strong>${expiresInMinutes} минут</strong>.</p>
      <p style="margin: 24px 0;">
        <a
          href="${resetUrl}"
          style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600;"
        >
          Сбросить пароль
        </a>
      </p>
      <p>Если кнопка не открывается, используйте эту ссылку:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log('[mail:console] Password reset email');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset URL: ${resetUrl}`);

    return { delivery: 'console' };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  });

  return {
    delivery: 'smtp',
    messageId: info.messageId
  };
}

module.exports = {
  isSmtpConfigured,
  sendPasswordResetEmail
};
