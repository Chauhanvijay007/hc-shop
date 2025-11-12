/**
 * Email templates for alerts and notifications
 * Using plain HTML for compatibility
 */

interface UrlDroppedEmailData {
  userName: string
  projectName: string
  url: string
  previousState: string
  newState: string
  detectedAt: string
  dashboardUrl: string
}

export function generateUrlDroppedEmail(data: UrlDroppedEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URL Dropped from Index</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      margin: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .alert-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .url-display {
      background: #f9fafb;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .status-change {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin: 25px 0;
      flex-wrap: wrap;
    }
    .status-badge {
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }
    .status-old {
      background-color: #d1fae5;
      color: #065f46;
    }
    .status-new {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .arrow {
      font-size: 20px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
      font-weight: 600;
      text-align: center;
    }
    .button:hover {
      background: #1d4ed8;
    }
    .info-section {
      margin: 20px 0;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 4px;
    }
    .info-label {
      font-weight: 600;
      color: #374151;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .status-change {
        flex-direction: column;
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>⚠️ URL Dropped from Index</h1>
    </div>

    <div class="content">
      <div class="greeting">
        Hi ${data.userName},
      </div>

      <div class="alert-box">
        <strong>⚠️ Alert:</strong> A URL in your project <strong>${data.projectName}</strong> has dropped from Google's index.
      </div>

      <div class="info-section">
        <div class="info-label">Affected URL:</div>
        <div class="url-display">${data.url}</div>
      </div>

      <div class="status-change">
        <span class="status-badge status-old">${data.previousState}</span>
        <span class="arrow">→</span>
        <span class="status-badge status-new">${data.newState}</span>
      </div>

      <div class="info-section">
        <div class="info-label">Detected at:</div>
        <div>${data.detectedAt}</div>
      </div>

      <p style="margin-top: 25px;">
        This change may indicate an indexing issue that needs your attention.
        We recommend:
      </p>

      <ul style="margin-left: 20px; line-height: 1.8;">
        <li>Checking your Google Search Console for detailed error messages</li>
        <li>Reviewing the URL for any recent changes or technical issues</li>
        <li>Verifying that the page is still accessible and crawlable</li>
        <li>Checking your robots.txt and sitemap configuration</li>
      </ul>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${data.dashboardUrl}" class="button">
          View in Dashboard →
        </a>
      </div>

      <div class="footer">
        <p>
          You're receiving this email because you have alerts enabled for the <strong>${data.projectName}</strong> project.
        </p>
        <p style="margin-top: 10px;">
          Indexing Insight Clone - Monitor your Google indexing status
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Plain text version
export function generateUrlDroppedEmailText(data: UrlDroppedEmailData): string {
  return `
URL Dropped from Index - ${data.projectName}

Hi ${data.userName},

A URL in your project "${data.projectName}" has dropped from Google's index.

Affected URL:
${data.url}

Status Change:
${data.previousState} → ${data.newState}

Detected at: ${data.detectedAt}

This change may indicate an indexing issue that needs your attention.

View details in your dashboard:
${data.dashboardUrl}

---
You're receiving this email because you have alerts enabled for this project.
`.trim()
}

// Additional template for bulk drops
interface BulkDropEmailData {
  userName: string
  projectName: string
  droppedCount: number
  totalUrls: number
  timeframe: string
  dashboardUrl: string
}

export function generateBulkDropEmail(data: BulkDropEmailData): string {
  const percentage = Math.round((data.droppedCount / data.totalUrls) * 100)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; }
    .container { background: #fff; margin: 20px; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; margin: -30px -30px 30px -30px; border-radius: 8px 8px 0 0; }
    .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .stats { background: #f9fafb; padding: 20px; border-radius: 4px; margin: 20px 0; }
    .stat-item { display: flex; justify-content: space-between; margin: 10px 0; }
    .button { display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Bulk Indexing Drop Detected</h1>
    </div>

    <p>Hi ${data.userName},</p>

    <div class="alert-box">
      <strong>🚨 Critical Alert:</strong> Multiple URLs in your project <strong>${data.projectName}</strong> have dropped from Google's index.
    </div>

    <div class="stats">
      <div class="stat-item">
        <span><strong>URLs Dropped:</strong></span>
        <span style="font-size: 24px; font-weight: bold; color: #dc2626;">${data.droppedCount}</span>
      </div>
      <div class="stat-item">
        <span><strong>Total URLs:</strong></span>
        <span>${data.totalUrls}</span>
      </div>
      <div class="stat-item">
        <span><strong>Percentage:</strong></span>
        <span style="font-weight: 600; color: #dc2626;">${percentage}%</span>
      </div>
      <div class="stat-item">
        <span><strong>Timeframe:</strong></span>
        <span>${data.timeframe}</span>
      </div>
    </div>

    <p>This significant drop may indicate a site-wide issue such as:</p>
    <ul>
      <li>robots.txt changes blocking Googlebot</li>
      <li>Server issues or downtime</li>
      <li>Security issues (malware, hacking)</li>
      <li>Technical SEO problems</li>
      <li>Manual actions or algorithmic penalties</li>
    </ul>

    <p><strong>Immediate action recommended!</strong></p>

    <div style="text-align: center;">
      <a href="${data.dashboardUrl}" class="button">View Dashboard →</a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; text-align: center;">
      <p>Indexing Insight Clone - Critical Alert</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
