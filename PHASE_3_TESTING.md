# Phase 3 Testing Guide

This guide covers testing all Phase 3 features: Sitemap Import, Saved Filters, Trends, Reports, Enhanced Alerts, and Alert Management.

## Prerequisites

1. **Environment Setup**: Ensure `.env` file is configured
2. **Database**: Run `npm run db:push` to sync schema
3. **Services Running**:
   - PostgreSQL database
   - Redis server
   - Next.js dev server: `npm run dev`
   - Worker process: `npm run worker`

## 1. Sitemap Import Testing

### API Endpoint
```
POST /api/projects/:id/urls/sitemap
```

### Test with cURL
```bash
# Import URLs from sitemap
curl -X POST http://localhost:3000/api/projects/YOUR_PROJECT_ID/urls/sitemap \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{
    "sitemapUrl": "https://example.com/sitemap.xml"
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Sitemap imported successfully",
  "stats": {
    "totalFound": 1250,
    "imported": 1200,
    "duplicates": 50,
    "failed": 0
  }
}
```

### Test Cases
- ✅ Valid sitemap URL
- ✅ Sitemap index (recursive loading)
- ✅ Duplicate URL detection
- ✅ Large sitemaps (batch processing)
- ❌ Invalid sitemap URL
- ❌ Non-XML response
- ❌ Unauthorized access

## 2. Saved Filters Testing

### API Endpoints

#### List Filters
```bash
GET /api/projects/:id/filters

curl http://localhost:3000/api/projects/YOUR_PROJECT_ID/filters \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

#### Create Filter
```bash
POST /api/projects/:id/filters

curl -X POST http://localhost:3000/api/projects/YOUR_PROJECT_ID/filters \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{
    "name": "Dropped URLs",
    "description": "URLs that dropped from index",
    "filterData": {
      "indexingState": ["not_indexed"],
      "hasChanged": true
    },
    "isPublic": false
  }'
```

#### Update Filter
```bash
PATCH /api/projects/:id/filters/:filterId

curl -X PATCH http://localhost:3000/api/projects/YOUR_PROJECT_ID/filters/FILTER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{
    "name": "Updated Filter Name",
    "isPublic": true
  }'
```

#### Delete Filter
```bash
DELETE /api/projects/:id/filters/:filterId

curl -X DELETE http://localhost:3000/api/projects/YOUR_PROJECT_ID/filters/FILTER_ID \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

### Test Cases
- ✅ Create filter with complex criteria
- ✅ Update filter properties
- ✅ Delete filter
- ✅ List all filters for project
- ❌ Unauthorized filter access
- ❌ Invalid filter data

## 3. Trends API Testing

### API Endpoint
```bash
GET /api/projects/:id/trends?days=30

curl "http://localhost:3000/api/projects/YOUR_PROJECT_ID/trends?days=30" \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

### Expected Response
```json
{
  "trends": [
    {
      "date": "2024-01-01",
      "indexed": 850,
      "not_indexed": 120,
      "discovered": 30,
      "errors": 5
    },
    {
      "date": "2024-01-02",
      "indexed": 870,
      "not_indexed": 110,
      "discovered": 20,
      "errors": 3
    }
  ],
  "summary": {
    "totalUrls": 1000,
    "currentIndexed": 870,
    "currentNotIndexed": 110,
    "changeRate": 2.3
  }
}
```

### Test Cases
- ✅ Default 30-day trends
- ✅ Custom date range (7, 14, 60, 90 days)
- ✅ Empty project (no data)
- ✅ Data aggregation accuracy
- ❌ Invalid days parameter
- ❌ Unauthorized access

## 4. Alert Management Testing

### API Endpoints

#### List Alerts
```bash
GET /api/projects/:id/alerts

curl http://localhost:3000/api/projects/YOUR_PROJECT_ID/alerts \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

#### Create Alert Rule
```bash
POST /api/projects/:id/alerts

curl -X POST http://localhost:3000/api/projects/YOUR_PROJECT_ID/alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{
    "name": "URL Dropped Alert",
    "description": "Alert when URLs drop from index",
    "alertType": "url_dropped",
    "isActive": true
  }'
```

#### Alert Types Available
- `url_dropped` - When URL goes from indexed to not indexed
- `url_indexed` - When URL goes from not indexed to indexed
- `error_detected` - When indexing errors occur
- `bulk_drop` - Multiple URLs drop at once (threshold-based)
- `not_indexed_duration` - URL not indexed for X days
- `specific_error` - Specific error pattern detected

#### Update Alert
```bash
PATCH /api/projects/:id/alerts/:alertId

curl -X PATCH http://localhost:3000/api/projects/YOUR_PROJECT_ID/alerts/ALERT_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{
    "isActive": false
  }'
```

#### Delete Alert
```bash
DELETE /api/projects/:id/alerts/:alertId

curl -X DELETE http://localhost:3000/api/projects/YOUR_PROJECT_ID/alerts/ALERT_ID \
  -H "Cookie: YOUR_AUTH_COOKIE"
```

### Test Cases
- ✅ Create alert for each type
- ✅ Enable/disable alerts
- ✅ Update alert properties
- ✅ Delete alert
- ✅ View alert history
- ❌ Invalid alert type
- ❌ Unauthorized access

## 5. Email Alerts Testing

### Alert Email Types

#### 1. URL Dropped Alert (Red Theme)
**Triggered when**: URL drops from Google's index
**Template**: `generateUrlDroppedEmail()`
**Subject**: ⚠️ URL Dropped from Index

#### 2. URL Indexed Alert (Green Theme)
**Triggered when**: URL becomes indexed
**Template**: `generateUrlIndexedEmail()`
**Subject**: ✅ URL Now Indexed

#### 3. Error Detected Alert (Orange Theme)
**Triggered when**: Indexing error occurs
**Template**: `generateErrorDetectedEmail()`
**Subject**: ⚠️ Indexing Error Detected

#### 4. Bulk Drop Alert (Dark Red Theme)
**Triggered when**: Multiple URLs drop simultaneously
**Template**: `generateBulkDropEmail()`
**Subject**: 🚨 CRITICAL: Bulk Indexing Drop

### Testing Alert Emails

1. **Create test alert rules** via API
2. **Trigger status changes** by checking URLs
3. **Check email delivery** (verify Resend dashboard)
4. **Validate email content** (HTML rendering, links)

### Manual Email Testing
```bash
# Test email sending directly
node -e "
const { sendUrlDroppedAlert } = require('./src/lib/email/alerts');
sendUrlDroppedAlert({
  email: 'test@example.com',
  userName: 'Test User',
  projectName: 'Test Project',
  url: 'https://example.com/page',
  previousState: 'indexed',
  newState: 'not_indexed',
  detectedAt: new Date(),
  projectId: 'test-id'
});
"
```

## 6. Report Testing

### Daily Reports
**Schedule**: Every day at 8 AM UTC
**Content**:
- Last 24 hours activity summary
- Status changes
- New issues detected
- Current stats

### Weekly Reports
**Schedule**: Every Monday at 9 AM UTC
**Content**:
- Last 7 days summary
- Improvements vs degradations
- Top issues
- Recommendations

### Manual Report Triggering

```javascript
// In src/lib/scheduler/daily-report.ts
import { triggerDailyReportNow } from '@/lib/scheduler/daily-report'
import { triggerWeeklyReportNow } from '@/lib/scheduler/weekly-report'

// Trigger reports manually
await triggerDailyReportNow()
await triggerWeeklyReportNow()
```

### Test via Worker Console

1. Start worker: `npm run worker`
2. Watch logs for scheduler startup
3. Check scheduled times:
   ```
   - Daily report: next run at [timestamp]
   - Weekly report: next run at [timestamp]
   ```
4. Wait for scheduled time or trigger manually
5. Verify email delivery

## 7. End-to-End Testing Flow

### Complete Test Scenario

1. **Setup Project**
   ```bash
   # Create project via UI or API
   # Import URLs via sitemap
   POST /api/projects/:id/urls/sitemap
   ```

2. **Configure Monitoring**
   ```bash
   # Set up alerts
   POST /api/projects/:id/alerts

   # Configure monitoring frequency
   PATCH /api/projects/:id
   ```

3. **Run Initial Checks**
   ```bash
   # Trigger bulk check
   POST /api/projects/:id/monitor
   ```

4. **Monitor Progress**
   ```bash
   # Check monitoring status
   GET /api/projects/:id/monitor/status

   # View recent changes
   GET /api/projects/:id/recent-changes
   ```

5. **Analyze Trends**
   ```bash
   # View 30-day trends
   GET /api/projects/:id/trends?days=30
   ```

6. **Create Saved Filters**
   ```bash
   # Save frequently used filters
   POST /api/projects/:id/filters
   ```

7. **Verify Alerts**
   - Check email inbox for alerts
   - Verify alert history in database
   - Test different alert types

8. **Review Reports**
   - Wait for daily/weekly report
   - Or trigger manually for testing
   - Verify email content and formatting

## 8. Performance Testing

### Load Testing Scenarios

1. **Large Sitemap Import**
   - Test with 10,000+ URLs
   - Monitor batch processing
   - Check memory usage

2. **Concurrent Alert Processing**
   - Trigger multiple status changes
   - Verify all alerts fire correctly
   - Check queue performance

3. **Trend Data Generation**
   - Request trends for long periods (90 days)
   - Verify query performance
   - Check response times

## 9. Error Scenarios

### Test Error Handling

1. **Invalid Sitemap URL**
   ```bash
   # Should return 400 error
   POST /api/projects/:id/urls/sitemap
   { "sitemapUrl": "not-a-url" }
   ```

2. **Unauthorized Access**
   ```bash
   # Should return 401 error
   GET /api/projects/other-users-project/filters
   ```

3. **Invalid Alert Type**
   ```bash
   # Should return 400 error
   POST /api/projects/:id/alerts
   { "alertType": "invalid_type" }
   ```

4. **Network Failures**
   - Test sitemap fetch timeout
   - Test email delivery failures
   - Verify retry logic

## 10. Database Verification

### Check Data Integrity

```sql
-- Verify SavedFilter entries
SELECT * FROM saved_filters WHERE project_id = 'YOUR_PROJECT_ID';

-- Check alert rules
SELECT * FROM alerts WHERE project_id = 'YOUR_PROJECT_ID';

-- View alert history
SELECT * FROM alert_history
WHERE alert_id IN (SELECT id FROM alerts WHERE project_id = 'YOUR_PROJECT_ID')
ORDER BY triggered_at DESC;

-- Analyze trend data
SELECT
  DATE(checked_at) as date,
  COUNT(*) as checks,
  SUM(CASE WHEN indexing_state = 'indexed' THEN 1 ELSE 0 END) as indexed_count
FROM indexing_checks
WHERE url_id IN (SELECT id FROM urls WHERE project_id = 'YOUR_PROJECT_ID')
GROUP BY DATE(checked_at)
ORDER BY date DESC
LIMIT 30;
```

## 11. Monitoring Workers

### Worker Health Check

```bash
# Start workers with logging
npm run worker

# Watch for:
# ✅ All workers started
# ✅ All schedulers running
# ✅ Next scheduled run times
# ✅ Successful job processing
```

### Queue Monitoring

```javascript
// Check queue stats
import { getQueueStats } from '@/lib/queue/queues'

const stats = await getQueueStats('daily-report')
console.log(stats)
// { waiting: 0, active: 1, completed: 45, failed: 2, total: 1 }
```

## 12. Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY in .env
   - Verify EMAIL_FROM is configured
   - Check Resend dashboard for errors

2. **Workers not processing**
   - Ensure Redis is running
   - Check REDIS_URL in .env
   - Restart worker process

3. **Sitemap import fails**
   - Verify sitemap URL is accessible
   - Check XML format validity
   - Look for CORS issues

4. **Trends data missing**
   - Ensure URLs have been checked
   - Verify indexing_checks table has data
   - Check date range parameters

## Summary

All Phase 3 features are now implemented and ready for testing:

- ✅ Sitemap Import with recursive parsing
- ✅ Saved Filters with full CRUD API
- ✅ Trends API for visualization data
- ✅ Enhanced Alert System (6 types)
- ✅ Alert Management API
- ✅ Daily & Weekly Email Reports
- ✅ Professional Email Templates
- ✅ Report Schedulers

For production deployment, ensure:
1. All environment variables are configured
2. Database migrations are applied
3. Redis server is available
4. Worker process is running as a service
5. Email delivery is configured and tested
