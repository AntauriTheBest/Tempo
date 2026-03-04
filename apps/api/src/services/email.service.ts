import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@todolist.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const isConfigured = SMTP_HOST && SMTP_USER && SMTP_PASS;

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName: string
): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  if (!transporter) {
    console.log('\n========================================');
    console.log('  PASSWORD RESET (SMTP not configured)');
    console.log('========================================');
    console.log(`  User:  ${userName} <${email}>`);
    console.log(`  Token: ${token}`);
    console.log(`  URL:   ${resetUrl}`);
    console.log('========================================\n');
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Restablecer contraseña</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en Todo-List Pro.</p>
      <p>Haz clic en el siguiente botón para establecer una nueva contraseña:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="background-color: #2563eb; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Restablecer contraseña
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        Este enlace expira en 1 hora. Si no solicitaste el cambio, puedes ignorar este mensaje.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
        <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Todo-List Pro" <${SMTP_FROM}>`,
    to: email,
    subject: 'Restablecer tu contraseña - Todo-List Pro',
    text: `Hola ${userName}, visita este enlace para restablecer tu contraseña: ${resetUrl} (expira en 1 hora)`,
    html,
  });
}
