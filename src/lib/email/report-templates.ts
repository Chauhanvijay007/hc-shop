import { format } from 'date-fns'

interface DailyReportData {
  userName: string
  projectName: string
  date: string
  stats: {
    totalUrls: number
    indexed: number
    notIndexed: number
    errors: number
    indexedPercentage: number
  }
  changes: Array<{
    url: string
    oldState: string
    newState: string
    changedAt: Date
  }>
  newIssues: Array<{
    url: string
    error: string
  }>
  dashboardUrl: string
}

export function generateDailyReportEmail(data: DailyReportData): string {
  const hasChanges = data.changes.length > 0
  const hasNewIssues = data.newIssues.length > 0

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; background-color: #f5f5f5; }
    .container { background: #fff; margin: 20px; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; margin: -30px -30px 30px -30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; }
    .stat-card { background: #f9fafb; padding: 20px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
    .stat-label { color: #6b7280; font-size: 14px; }
    .stat-indexed .stat-value { color: #10b981; }
    .stat-notindexed .stat-value { color: #f59e0b; }
    .stat-errors .stat-value { color: #ef4444; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
    .change-item { background: #f9fafb; padding: 15px; margin-bottom: 10px; border-radius: 4px; border-left: 3px solid #3b82f6; }
    .url { font-family: monospace; font-size: 13px; word-break: break-all; color: #1f2937; }
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin: 5px 5px 0 0; }
    .badge-indexed { background: #d1fae5; color: #065f46; }
    .badge-notindexed { background: #fef3c7; color: #92400e; }
    .button { display: inline-block; background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .empty-state { text-align: center; padding: 30px; color: #6b7280; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Indexing Report</h1>
      <p>${data.projectName} • ${data.date}</p>
    </div>

    <p>Hi ${data.userName},</p>
    <p>Here's your daily summary of indexing status for <strong>${data.projectName}</strong>:</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${data.stats.totalUrls}</div>
        <div class="stat-label">Total URLs</div>
      </div>
      <div class="stat-card stat-indexed">
        <div class="stat-value">${data.stats.indexedPercentage}%</div>
        <div class="stat-label">Indexed</div>
      </div>
      <div class="stat-card stat-notindexed">
        <div class="stat-value">${data.stats.notIndexed}</div>
        <div class="stat-label">Not Indexed</div>
      </div>
      <div class="stat-card stat-errors">
        <div class="stat-value">${data.stats.errors}</div>
        <div class="stat-label">Errors</div>
      </div>
    </div>

    ${hasChanges ? `
    <div class="section">
      <div class="section-title">📈 Status Changes (${data.changes.length})</div>
      ${data.changes.slice(0, 10).map(change => `
        <div class="change-item">
          <div class="url">${change.url}</div>
          <div>
            <span class="status-badge badge-${change.oldState === 'indexed' ? 'indexed' : 'notindexed'}">${change.oldState}</span>
            →
            <span class="status-badge badge-${change.newState === 'indexed' ? 'indexed' : 'notindexed'}">${change.newState}</span>
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            ${format(change.changedAt, 'PPp')}
          </div>
        </div>
      `).join('')}
      ${data.changes.length > 10 ? `<p style="text-align: center; color: #6b7280;">And ${data.changes.length - 10} more changes...</p>` : ''}
    </div>
    ` : '<div class="empty-state">✅ No status changes in the last 24 hours</div>'}

    ${hasNewIssues ? `
    <div class="section">
      <div class="section-title">⚠️ New Issues (${data.newIssues.length})</div>
      ${data.newIssues.slice(0, 5).map(issue => `
        <div class="change-item" style="border-left-color: #ef4444;">
          <div class="url">${issue.url}</div>
          <div style="color: #dc2626; font-size: 13px; margin-top: 5px;">${issue.error}</div>
        </div>
      `).join('')}
      ${data.newIssues.length > 5 ? `<p style="text-align: center; color: #6b7280;">And ${data.newIssues.length - 5} more issues...</p>` : ''}
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 30px;">
      <a href="${data.dashboardUrl}" class="button">View Full Dashboard →</a>
    </div>

    <div class="footer">
      <p>Indexing Insight Clone - Daily Report</p>
      <p>This report covers changes from the last 24 hours</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

interface WeeklyReportData extends DailyReportData {
  weekRange: string
  topIssues: Array<{
    issue: string
    count: number
  }>
  improvements: number
  degradations: number
}

export function generateWeeklyReportEmail(data: WeeklyReportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; background-color: #f5f5f5; }
    .container { background: #fff; margin: 20px; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 40px 30px; text-align: center; margin: -30px -30px 30px -30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; }
    .stat-card { background: #f9fafb; padding: 20px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .stat-label { color: #6b7280; font-size: 14px; }
    .highlight-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .highlight-value { font-size: 48px; font-weight: bold; color: #92400e; }
    .highlight-label { color: #92400e; font-size: 16px; font-weight: 600; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
    .issue-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f9fafb; margin-bottom: 10px; border-radius: 4px; }
    .issue-count { background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px; }
    .change-summary { display: flex; justify-content: space-around; margin: 20px 0; }
    .change-stat { text-align: center; }
    .change-stat-value { font-size: 32px; font-weight: bold; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .button { display: inline-block; background: #7c3aed; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 Weekly Indexing Report</h1>
      <p>${data.projectName}</p>
      <p style="font-size: 14px; margin-top: 5px;">${data.weekRange}</p>
    </div>

    <p>Hi ${data.userName},</p>
    <p>Here's your weekly summary of indexing performance for <strong>${data.projectName}</strong>:</p>

    <div class="highlight-box">
      <div class="highlight-value">${data.stats.indexedPercentage}%</div>
      <div class="highlight-label">Currently Indexed</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${data.stats.totalUrls}</div>
        <div class="stat-label">Total URLs Monitored</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.stats.indexed}</div>
        <div class="stat-label">Indexed URLs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.stats.notIndexed}</div>
        <div class="stat-label">Not Indexed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.stats.errors}</div>
        <div class="stat-label">Active Errors</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📊 Weekly Activity</div>
      <div class="change-summary">
        <div class="change-stat">
          <div class="change-stat-value positive">+${data.improvements}</div>
          <div style="color: #6b7280; font-size: 14px;">Improvements</div>
        </div>
        <div class="change-stat">
          <div class="change-stat-value negative">-${data.degradations}</div>
          <div style="color: #6b7280; font-size: 14px;">Degradations</div>
        </div>
        <div class="change-stat">
          <div class="change-stat-value">${data.changes.length}</div>
          <div style="color: #6b7280; font-size: 14px;">Total Changes</div>
        </div>
      </div>
    </div>

    ${data.topIssues.length > 0 ? `
    <div class="section">
      <div class="section-title">🔍 Top Issues This Week</div>
      ${data.topIssues.map(issue => `
        <div class="issue-item">
          <div>${issue.issue}</div>
          <div class="issue-count">${issue.count}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div style="background: #eff6ff; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <p style="margin: 0; font-weight: 600; color: #1e40af;">💡 Recommendation</p>
      <p style="margin: 10px 0 0 0; color: #1e40af;">
        ${data.stats.errors > 0
          ? `You have ${data.stats.errors} URL(s) with errors. Review these in your dashboard to improve indexing.`
          : data.stats.notIndexed > data.stats.indexed * 0.1
          ? `${data.stats.notIndexed} URLs are not indexed. Consider checking your robots.txt and sitemap.`
          : 'Great job! Your indexing status looks healthy. Keep monitoring regularly.'
        }
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${data.dashboardUrl}" class="button">View Detailed Report →</a>
    </div>

    <div class="footer">
      <p>Indexing Insight Clone - Weekly Report</p>
      <p>This report covers the past 7 days of activity</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
