/**
 * Builds a branded invitation email for onboarding clients.
 * The email contains a magic link that signs the client in on click.
 */
export function buildInvitationEmail({
  clientName,
  businessName,
  senderName,
  magicLink,
}: {
  clientName: string;
  businessName: string;
  senderName: string;
  magicLink: string;
}): { subject: string; html: string } {
  const subject = `${senderName} invited you to complete your onboarding`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0f;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="520" style="margin: 0 auto; max-width: 520px;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                hsfx<span style="color: #3b82f6;">.</span>dev
              </h1>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #111118; border: 1px solid #1e1e2a; border-radius: 12px; padding: 40px 32px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #ffffff; text-align: center;">
                Hey ${escape(clientName)}, your onboarding is ready
              </h2>
              <p style="margin: 0 0 24px; font-size: 15px; color: #8b8b9e; line-height: 1.6; text-align: center;">
                <strong style="color: #ffffff;">${escape(senderName)}</strong> has set up an onboarding form for <strong style="color: #ffffff;">${escape(businessName)}</strong>.
              </p>

              <p style="margin: 0 0 32px; font-size: 15px; color: #8b8b9e; line-height: 1.6; text-align: center;">
                Click the button below to get started. It should only take about 5 minutes to fill out.
              </p>

              <!-- Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #3b82f6;">
                    <a href="${escape(magicLink)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Start Onboarding
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What to expect -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px; border-top: 1px solid #1e1e2a; padding-top: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #55556a; line-height: 1.6;">
                    <p style="margin: 0 0 12px; color: #8b8b9e; font-weight: 600;">What to expect:</p>
                    <p style="margin: 0 0 6px;">We'll ask about your brand colors, services, contact info, and a few other details to build your website.</p>
                    <p style="margin: 0 0 6px;">Your progress saves automatically, so you can come back anytime to finish or make changes.</p>
                    <p style="margin: 0;">Just click the button above to sign in and get started.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #44445a;">
                Sent by ${escape(senderName)} via hsfx.dev
              </p>
              <p style="margin: 0; font-size: 12px; color: #44445a;">
                If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
