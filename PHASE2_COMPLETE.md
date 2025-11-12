# Phase 2: Monitoring & Automation - COMPLETE ✅

## Overview

Phase 2 has been successfully implemented, adding automated monitoring, background job processing, status change detection, and email alerts to the Indexing Insight Clone.

---

## ✅ Implemented Features

### 1. Background Job Queue System (BullMQ)
- ✅ Multiple queue types for different job categories
- ✅ URL Inspection Queue (individual URL checks)
- ✅ Bulk Check Queue (batch processing)
- ✅ Alert Check Queue (alert evaluation and sending)
- ✅ Daily/Weekly Report Queues (report generation)
- ✅ Rate limiting (600 requests/minute for Google API)
- ✅ Automatic retry with exponential backoff
- ✅ Job progress tracking
- ✅ Failed job logging and retention

### 2. Workers
- ✅ **URL Inspection Worker**: Calls Google API, stores results, detects changes
- ✅ **Bulk Check Worker**: Schedules multiple URLs efficiently
- ✅ **Alert Check Worker**: Evaluates alert rules and sends notifications
- ✅ Concurrency control (10 URL checks, 5 bulk jobs, 20 alerts simultaneously)
- ✅ Graceful shutdown handling
- ✅ Error logging and monitoring

### 3. Automated Schedulers
- ✅ **Daily Monitoring**: Runs at 2 AM UTC for all daily-frequency URLs
- ✅ **Weekly Monitoring**: Runs Sundays at 3 AM UTC for weekly URLs
- ✅ Automatic project discovery and URL batching
- ✅ Manual trigger capability for testing

### 4. Status Change Detection
- ✅ Compare current check with previous check
- ✅ Detect indexing state changes (indexed ↔ not_indexed)
- ✅ Detect coverage state changes
- ✅ Store change history in database
- ✅ Track notified status
- ✅ Change statistics and analytics

### 5. Email Alert System
- ✅ **Resend integration** for reliable email delivery
- ✅ **URL Dropped Alert**: Notify when URL loses indexing
- ✅ **Bulk Drop Alert**: Critical alert for multiple URL drops
- ✅ Professional HTML email templates
- ✅ Plain text fallback versions
- ✅ Direct dashboard links in emails
- ✅ Alert history tracking

### 6. Monitoring API Endpoints
- ✅ `POST /api/projects/:id/monitor` - Trigger manual monitoring
- ✅ `GET /api/projects/:id/monitor/status` - Get queue and project status
- ✅ `GET /api/projects/:id/recent-changes` - View recent status changes
- ✅ Authentication and authorization
- ✅ Input validation with Zod

### 7. Database Enhancements
- ✅ Added `lastCheckedAt` to URL model
- ✅ All Phase 2 tables already exist (MonitoringQueue, StatusChange, Alert, AlertHistory)
- ✅ Proper indexing for performance
- ✅ Cascade delete relations

---

## 📁 New Files Created

### Queue System
- `/src/lib/queue/types.ts` - Type definitions
- `/src/lib/queue/queues.ts` - Queue instances and helpers

### Workers
- `/src/workers/url-inspection-worker.ts` - Main URL checking worker
- `/src/workers/bulk-check-worker.ts` - Batch processing worker
- `/src/workers/alert-check-worker.ts` - Alert evaluation worker
- `/src/workers/index.ts` - Worker manager (updated)

### Schedulers
- `/src/lib/scheduler/daily-monitor.ts` - Daily cron job
- `/src/lib/scheduler/weekly-monitor.ts` - Weekly cron job

### Change Detection
- `/src/lib/monitoring/change-detection.ts` - Status change logic

### Email System
- `/src/lib/email/client.ts` - Resend client setup
- `/src/lib/email/templates.ts` - HTML email templates
- `/src/lib/email/alerts.ts` - Alert sending functions

### API Endpoints
- `/src/app/api/projects/[id]/monitor/route.ts` - Trigger monitoring
- `/src/app/api/projects/[id]/monitor/status/route.ts` - Get status
- `/src/app/api/projects/[id]/recent-changes/route.ts` - View changes

---

## 🚀 How to Use

### Setup

1. **Install dependencies** (if not already):
```bash
npm install
```

2. **Update environment variables**:
```env
# Add to .env
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=alerts@yourdomain.com
REDIS_URL=redis://localhost:6379
```

3. **Push database schema** (adds lastCheckedAt field):
```bash
npm run db:push
```

4. **Start Redis**:
```bash
redis-server
# OR
docker run -d -p 6379:6379 redis:alpine
```

### Running Workers

**Terminal 1 - Next.js Server**:
```bash
npm run dev
```

**Terminal 2 - Background Workers**:
```bash
npm run worker
```

You'll see output like:
```
🚀 Starting Indexing Insight Workers...
=====================================

✅ 3 workers started:
   - URL Inspection Worker
   - Bulk Check Worker
   - Alert Check Worker

📅 Starting schedulers...
🚀 Daily monitoring scheduler started (runs at 2 AM UTC)
🚀 Weekly monitoring scheduler started (runs Sundays at 3 AM UTC)
   - Daily monitoring: next run at 11/13/2025, 2:00:00 AM
   - Weekly monitoring: next run at 11/17/2025, 3:00:00 AM

✅ All workers and schedulers are running!
```

---

## 🧪 Testing Phase 2

### 1. Manual URL Check (triggers worker)
```bash
curl -X POST http://localhost:3000/api/projects/{PROJECT_ID}/monitor \
  -H "Content-Type: application/json" \
  -d '{"checkAll": true}' \
  --cookie "auth-cookie"
```

### 2. Check Queue Status
```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}/monitor/status
```

### 3. View Recent Changes
```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}/recent-changes?hours=24
```

### 4. Watch Worker Logs
Check Terminal 2 for real-time worker activity:
- Job processing
- Status change detection
- Alert triggering
- Error handling

---

## 📊 Monitoring & Debugging

### View Queue Stats
```bash
# Connect to Redis CLI
redis-cli

# View all keys
KEYS *

# Check queue length
LLEN bull:url-inspection:wait

# View job data
HGETALL bull:url-inspection:{JOB_ID}
```

### View Database
```bash
npm run db:studio
```

Then check:
- `monitoring_queue` table - job status
- `status_changes` table - detected changes
- `alert_history` table - triggered alerts
- `indexing_checks` table - check results

### Worker Logs
All workers log to console:
- ✅ Successful jobs
- ❌ Failed jobs
- ⚠️ Status changes detected
- 📧 Emails sent
- 🔔 Alerts triggered

---

## 🔔 Alert System

### Alert Types (implemented)
1. **url_dropped** - URL lost indexing status
2. **error_detected** - Coverage state is error
3. **bulk_drop** - Multiple URLs dropped (template ready)

### How Alerts Work
1. URL check completes → stored in database
2. Change detection compares with previous check
3. If change detected → StatusChange record created
4. Alert Check job triggered
5. Alert rules evaluated
6. Email sent if rule matches
7. AlertHistory record created

### Email Requirements
- Sign up at https://resend.com/
- Add domain or use test domain
- Get API key
- Update `.env` with `RESEND_API_KEY`

---

## ⏰ Scheduler Behavior

### Daily Monitoring (2 AM UTC)
- Finds all projects
- Gets URLs with `monitoringFrequency = 'daily'`
- Creates bulk check job for each project
- Processes in background via workers

### Weekly Monitoring (Sundays 3 AM UTC)
- Same as daily but for `weekly` frequency URLs
- Avoids conflicts with daily run

### Manual Trigger (for testing)
```typescript
import { triggerDailyMonitorNow } from '@/lib/scheduler/daily-monitor'

await triggerDailyMonitorNow() // Runs immediately
```

---

## 🔄 Job Flow

```
User triggers check
    ↓
Bulk Check Job created
    ↓
Bulk Check Worker processes
    ↓
Creates URL Inspection Jobs (one per URL)
    ↓
URL Inspection Workers process (10 concurrent)
    ↓
Google API called (rate-limited)
    ↓
Results stored in database
    ↓
Change detection runs
    ↓
If change detected → Alert Check Job
    ↓
Alert Check Worker evaluates rules
    ↓
Email sent if rules match
    ↓
Alert History recorded
```

---

## 📈 Performance

- **Concurrency**: 10 URL checks simultaneously
- **Rate Limit**: 600 requests/minute (Google API limit)
- **Batch Size**: Configurable via bulk check
- **Retry Logic**: 3 attempts with exponential backoff
- **Job Retention**: 100 completed, 500 failed jobs kept

---

## 🎯 Next Steps (Phase 3)

After Phase 2, you can implement:
- Sitemap import functionality
- Advanced URL filtering (regex, date ranges)
- Trend visualization charts
- Multiple alert rule types
- Daily/weekly email reports
- Saved filter presets

---

## 🐛 Troubleshooting

### Workers not processing jobs
```bash
# Check Redis connection
redis-cli ping  # Should return "PONG"

# Check worker logs for errors
npm run worker

# Verify queue has jobs
redis-cli
LLEN bull:url-inspection:wait
```

### Emails not sending
- Check RESEND_API_KEY in .env
- Verify domain is configured in Resend
- Check worker logs for email errors
- Test Resend API manually

### Jobs failing
- Check Google OAuth tokens are valid
- Verify Search Console property access
- Check API rate limits
- Review error logs in monitoring_queue table

### Scheduler not running
- Verify cron expression is correct
- Check timezone (should be UTC)
- Manually trigger to test
- Check scheduler logs

---

## ✅ Phase 2 Completion Checklist

- [x] BullMQ and Redis setup complete
- [x] URL inspection worker implemented
- [x] Bulk check worker implemented
- [x] Alert check worker implemented
- [x] Daily monitoring scheduler working
- [x] Weekly monitoring scheduler working
- [x] Status change detection functional
- [x] Email alert system with templates
- [x] Retry logic handling failures
- [x] API endpoints tested
- [x] Database schema updated
- [x] Worker manager with graceful shutdown
- [x] Email service configured (Resend)
- [x] Documentation complete

---

## 📝 Summary

Phase 2 transforms the Indexing Insight Clone from a manual checking tool into a fully automated monitoring platform. It continuously monitors URLs, detects changes, and alerts users via email when issues occur.

**Key Achievement**: The application now runs 24/7, automatically checking URLs and keeping users informed of indexing changes without manual intervention.

**Ready for Phase 3!** 🚀
