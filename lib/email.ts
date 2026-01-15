import nodemailer from "nodemailer";

/**
 * Get the base URL for the application
 * Falls back to Vercel URL or localhost if NEXT_PUBLIC_APP_URL is not set
 */
function getBaseUrl(): string {
  // Check for explicit environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback to Vercel URL if available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback to localhost for development
  return process.env.NODE_ENV === "production"
    ? "https://arnob-mahmud.vercel.app"
    : "http://localhost:3000";
}

/**
 * Generate a random ticket number for email subject
 */
function generateTicketNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format timestamp for email subject
 */
function formatTimestamp(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "");
  return `${date}${time}`;
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password?email=${encodeURIComponent(
    email
  )}&token=${resetToken}`;
  const ticketNumber = generateTicketNumber();
  const timestamp = formatTimestamp();

  // Professional email subject with ticket number and timestamp to avoid spam
  const subject = `Password Reset Request [Ticket #${ticketNumber}] - ${timestamp}`;

  // Professional, responsive email template that works across all email clients
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Password Reset Request</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                🔒 Password Reset Request
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>
              <p style="margin: 0 0 25px; color: #555555; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your account. If you made this request, please click the button below to reset your password:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Reset Your Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 0 0 25px; color: #888888; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; padding: 12px; background-color: #f8f9fa; border-left: 4px solid #667eea; word-break: break-all; color: #333333; font-size: 13px; line-height: 1.5; font-family: 'Courier New', monospace;">
                ${resetLink}
              </p>
              
              <!-- Important Notice -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 0 0 25px; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⏰ Important:</strong> This link will expire in <strong>15 minutes</strong> for security reasons.
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 15px; margin: 0 0 25px; border-radius: 4px;">
                <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.6;">
                  <strong>🔐 Security:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
              <p style="margin: 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: #333333;">Dev Blog Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 12px; line-height: 1.5;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 11px; line-height: 1.5;">
                Ticket #${ticketNumber} | ${new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  })}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Dev Blog" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: html,
    // Plain text version for email clients that don't support HTML
    text: `Password Reset Request

Hello,

We received a request to reset your password for your account. If you made this request, please click the link below to reset your password:

${resetLink}

This link will expire in 15 minutes.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
Dev Blog Team

---
Ticket #${ticketNumber} | ${new Date().toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    })}
This is an automated email. Please do not reply to this message.`,
  };

  await transporter.sendMail(mailOptions);
}
