/**
 * Email Service for sending notifications
 *
 * This is a placeholder structure. In production, integrate with:
 * - Resend (https://resend.com)
 * - SendGrid (https://sendgrid.com)
 * - AWS SES
 * - Postmark
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface AlertEmailData {
  alertTitle: string;
  alertMessage: string;
  propertyName: string;
  severity: string;
  timestamp: string;
  alertUrl: string;
}

export interface ReportEmailData {
  reportName: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  metrics: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  reportUrl: string;
}

/**
 * Send an email (placeholder implementation)
 * In production, implement with your email service provider
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // TODO: Implement with actual email service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'SEO Gets <alerts@yourdomain.com>',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    // });

    console.log("Email would be sent:", {
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Generate HTML template for alert emails
 */
export function generateAlertEmail(data: AlertEmailData): string {
  const severityColor = {
    high: "#EF4444",
    medium: "#F59E0B",
    low: "#3B82F6",
  }[data.severity] || "#F59E0B";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.alertTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <h1 style="margin: 0 0 16px 0; font-size: 24px; color: ${severityColor};">
      🔔 ${data.alertTitle}
    </h1>
    <p style="margin: 0 0 8px 0; color: #6b7280;">
      <strong>Property:</strong> ${data.propertyName}
    </p>
    <p style="margin: 0; color: #6b7280;">
      <strong>Time:</strong> ${data.timestamp}
    </p>
  </div>

  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 16px; color: #111827;">
      ${data.alertMessage}
    </p>
  </div>

  <div style="text-align: center;">
    <a href="${data.alertUrl}"
       style="display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
      View Alert Details
    </a>
  </div>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p>This alert was generated automatically by SEO Gets Clone.</p>
    <p>
      <a href="${data.alertUrl.replace('/alerts/', '/alert-rules')}" style="color: #3B82F6; text-decoration: none;">
        Manage Alert Rules
      </a>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML template for report emails
 */
export function generateReportEmail(data: ReportEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.reportName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 8px; padding: 32px; margin-bottom: 24px; text-align: center; color: white;">
    <h1 style="margin: 0 0 8px 0; font-size: 28px;">
      📊 ${data.reportName}
    </h1>
    <p style="margin: 0; opacity: 0.9;">
      ${data.propertyName}
    </p>
    <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">
      ${data.startDate} - ${data.endDate}
    </p>
  </div>

  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #111827;">Performance Summary</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; color: #6b7280;">Total Clicks</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">
          ${data.metrics.clicks.toLocaleString()}
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; color: #6b7280;">Total Impressions</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">
          ${data.metrics.impressions.toLocaleString()}
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 0; color: #6b7280;">Average CTR</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">
          ${(data.metrics.ctr * 100).toFixed(2)}%
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; color: #6b7280;">Average Position</td>
        <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">
          ${data.metrics.position.toFixed(1)}
        </td>
      </tr>
    </table>
  </div>

  <div style="text-align: center;">
    <a href="${data.reportUrl}"
       style="display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500;">
      View Full Report
    </a>
  </div>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p>This report was generated automatically by SEO Gets Clone.</p>
    <p>
      <a href="${data.reportUrl.replace('/reports/', '/settings')}" style="color: #3B82F6; text-decoration: none;">
        Manage Email Preferences
      </a>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Send alert notification email
 */
export async function sendAlertEmail(
  to: string | string[],
  alertData: AlertEmailData
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `🔔 ${alertData.alertTitle}`,
    html: generateAlertEmail(alertData),
  });
}

/**
 * Send report email
 */
export async function sendReportEmail(
  to: string | string[],
  reportData: ReportEmailData
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `📊 ${reportData.reportName} - ${reportData.propertyName}`,
    html: generateReportEmail(reportData),
  });
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(
  to: string,
  inviterName: string,
  propertyName: string,
  role: string,
  acceptUrl: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="margin: 0; font-size: 32px;">👥</h1>
    <h2 style="margin: 16px 0 8px 0; font-size: 24px; color: #111827;">
      You've been invited!
    </h2>
    <p style="margin: 0; color: #6b7280; font-size: 16px;">
      ${inviterName} invited you to join their team
    </p>
  </div>

  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px 0; color: #111827;">
      You've been invited as a <strong>${role}</strong> for:
    </p>
    <p style="margin: 0; padding: 16px; background: #f9fafb; border-radius: 6px; font-weight: 600; color: #111827;">
      ${propertyName}
    </p>
  </div>

  <div style="text-align: center;">
    <a href="${acceptUrl}"
       style="display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
      Accept Invitation
    </a>
  </div>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `${inviterName} invited you to join their team on SEO Gets Clone`,
    html,
  });
}
