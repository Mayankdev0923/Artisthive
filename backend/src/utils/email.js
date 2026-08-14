import { config } from '../config/index.js';

export async function sendOtpEmail(email, magicLink) {
  if (config.nodeEnv === 'development' && !config.email.resendApiKey && !config.email.brevoApiKey) {
    console.log(`[DEV] OTP email to ${email}: ${magicLink}`);
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="margin:0 0 8px">Welcome to Artisthive</h2>
      <p>Use the link or code below to sign in.</p>
      <p style="margin:20px 0"><a href="${magicLink}" style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Sign in</a></p>
      <p style="color:#666;font-size:13px">Or open the magic link directly: ${magicLink}</p>
    </div>
  `;

  try {
    if (config.email.provider === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(config.email.resendApiKey);
      await resend.emails.send({ from: config.email.from, to: email, subject: 'Your Artisthive sign-in link', html });
    } else {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.email.brevoApiKey,
        },
        body: JSON.stringify({
          sender: { email: config.email.from },
          to: [{ email }],
          subject: 'Your Artisthive sign-in link',
          htmlContent: html,
        }),
      });
      if (!response.ok) throw new Error(`Brevo error ${response.status}`);
    }
  } catch (err) {
    console.error('[EMAIL] failed to send OTP:', err.message);
  }
}