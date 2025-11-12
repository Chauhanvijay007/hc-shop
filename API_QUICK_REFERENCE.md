# API Quick Reference - Phase 3 Features

## Sitemap Import

```bash
# Import URLs from XML sitemap
POST /api/projects/:projectId/urls/sitemap
Content-Type: application/json

{
  "sitemapUrl": "https://example.com/sitemap.xml"
}

Response: {
  "success": true,
  "stats": {
    "totalFound": 1250,
    "imported": 1200,
    "duplicates": 50,
    "failed": 0
  }
}
```

## Saved Filters

```bash
# List all filters
GET /api/projects/:projectId/filters

# Create new filter
POST /api/projects/:projectId/filters
{
  "name": "Dropped URLs",
  "description": "URLs that dropped from index",
  "filterData": { "indexingState": ["not_indexed"], "hasChanged": true },
  "isPublic": false
}

# Update filter
PATCH /api/projects/:projectId/filters/:filterId
{ "name": "New Name", "isPublic": true }

# Delete filter
DELETE /api/projects/:projectId/filters/:filterId
```

## Trends API

```bash
# Get trend data for last N days
GET /api/projects/:projectId/trends?days=30

Response: {
  "trends": [
    {
      "date": "2024-01-01",
      "indexed": 850,
      "not_indexed": 120,
      "discovered": 30,
      "errors": 5
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

## Alert Management

```bash
# List all alert rules
GET /api/projects/:projectId/alerts

# Create alert rule
POST /api/projects/:projectId/alerts
{
  "name": "URL Dropped Alert",
  "description": "Alert when URLs drop from index",
  "alertType": "url_dropped",
  "isActive": true
}

# Alert types: url_dropped, url_indexed, error_detected, bulk_drop, specific_error, not_indexed_duration

# Get alert details
GET /api/projects/:projectId/alerts/:alertId

# Update alert
PATCH /api/projects/:projectId/alerts/:alertId
{ "isActive": false }

# Delete alert
DELETE /api/projects/:projectId/alerts/:alertId
```

## Workers & Schedulers

### Workers Running (5)
1. **URL Inspection Worker** - Checks individual URLs
2. **Bulk Check Worker** - Processes bulk check requests
3. **Alert Check Worker** - Evaluates alert conditions
4. **Daily Report Worker** - Generates daily email reports
5. **Weekly Report Worker** - Generates weekly email reports

### Schedulers Running (4)
1. **Daily Monitor** - 2 AM UTC (checks daily URLs)
2. **Weekly Monitor** - Monday 2 AM UTC (checks weekly URLs)
3. **Daily Report** - 8 AM UTC (sends daily reports)
4. **Weekly Report** - Monday 9 AM UTC (sends weekly reports)

### Start Workers
```bash
npm run worker
```

## Email Templates

### Alert Emails
1. **URL Dropped** (Red) - ⚠️ URL Dropped from Index
2. **URL Indexed** (Green) - ✅ URL Now Indexed
3. **Error Detected** (Orange) - ⚠️ Indexing Error Detected
4. **Bulk Drop** (Dark Red) - 🚨 CRITICAL: Bulk Indexing Drop

### Report Emails
1. **Daily Report** (Blue) - Daily summary of last 24 hours
2. **Weekly Report** (Purple) - Weekly analysis with trends

## Environment Variables

```env
# Required for Phase 3
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Testing Commands

```bash
# Database
npm run db:push          # Sync schema
npm run db:studio        # Open Prisma Studio

# Development
npm run dev              # Start Next.js dev server
npm run worker           # Start background workers

# Testing with cURL
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/urls/sitemap \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{"sitemapUrl": "https://example.com/sitemap.xml"}'
```

## Common Patterns

### Error Responses
```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

### Success Responses
```json
{
  "success": true,
  "data": { ... }
}
```

### Pagination (when available)
```json
{
  "items": [...],
  "total": 1000,
  "page": 1,
  "pageSize": 50
}
```

## Quick Start Testing

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Fill in required values
   ```

2. **Initialize Database**
   ```bash
   npm run db:push
   ```

3. **Start Services**
   ```bash
   # Terminal 1: Start Redis
   redis-server

   # Terminal 2: Start Next.js
   npm run dev

   # Terminal 3: Start Workers
   npm run worker
   ```

4. **Test API Endpoints**
   - See PHASE_3_TESTING.md for detailed test cases
   - Use cURL examples above
   - Or use Postman/Insomnia

## Support

- 📖 Full Testing Guide: `PHASE_3_TESTING.md`
- 📋 Implementation Details: `IMPLEMENTATION_SUMMARY.md`
- 🐛 Issues: Check logs in worker terminal and Next.js terminal
