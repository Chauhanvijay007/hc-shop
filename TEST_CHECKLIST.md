# ✅ Testing Checklist

## Pre-Flight Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL running
- [ ] Redis running (`redis-cli ping` returns "PONG")
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Database created and schema pushed (`npm run db:push`)

## Google OAuth Setup

- [ ] Google Cloud project created
- [ ] Google Search Console API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URI configured: `http://localhost:3000/api/auth/callback/google`
- [ ] Client ID and Secret in `.env`
- [ ] You have a verified property in Search Console (for actual API testing)

## Application Testing

### Authentication
- [ ] Server starts without errors (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Redirects to /signin when not logged in
- [ ] "Sign in with Google" button appears
- [ ] Google OAuth flow works
- [ ] Successfully redirected to dashboard after login
- [ ] User info appears in UI

### Project Management
- [ ] Can create a new project
- [ ] Project appears on dashboard
- [ ] Can select project from dropdown
- [ ] Project stats load correctly

### URL Management
- [ ] Can add a single URL
- [ ] URL appears in URL list
- [ ] Can add bulk URLs (paste multiple)
- [ ] Bulk import shows success message
- [ ] URL list displays with status badges
- [ ] Search functionality works
- [ ] Pagination works (if >50 URLs)

### Background Worker
- [ ] Worker starts without errors (`npm run worker`)
- [ ] Worker connects to Redis
- [ ] Jobs appear in queue (check logs)
- [ ] Manual URL check works

### Dashboard
- [ ] Summary cards display correct numbers
- [ ] Total URLs count is accurate
- [ ] Indexed percentage calculates correctly
- [ ] Can navigate between pages
- [ ] "View All URLs" link works
- [ ] "Add URLs" button works

### Database
- [ ] Can open Prisma Studio (`npm run db:studio`)
- [ ] All tables exist: users, accounts, projects, urls, indexing_checks, etc.
- [ ] Data persists after creating/adding items
- [ ] No connection errors in logs

## Advanced Testing (Optional)

### API Endpoints
- [ ] GET /api/projects returns projects
- [ ] POST /api/projects creates project
- [ ] GET /api/projects/:id/urls returns URLs
- [ ] POST /api/projects/:id/urls adds URL
- [ ] POST /api/projects/:id/urls/bulk imports URLs
- [ ] GET /api/projects/:id/stats returns statistics

### Google API Integration
- [ ] Can trigger manual URL check
- [ ] Check result appears in database
- [ ] Status change is detected
- [ ] Historical data is stored
- [ ] Error handling works for invalid URLs

### Error Handling
- [ ] Invalid URLs are rejected
- [ ] Duplicate URLs show appropriate message
- [ ] API errors are caught and logged
- [ ] Database errors don't crash the app

## Performance
- [ ] Page loads in < 2 seconds
- [ ] URL list loads quickly with many URLs
- [ ] Bulk import handles 100+ URLs
- [ ] Worker processes jobs without crashing

## Known Limitations (Phase 1 MVP)
- ⚠️ No sitemap import yet (Phase 2)
- ⚠️ No email alerts yet (Phase 2)
- ⚠️ No advanced filtering (regex, date ranges) yet (Phase 3)
- ⚠️ No data export yet (Phase 4)
- ⚠️ No trend charts yet (Phase 3)

## Issues Found
Document any issues:

| Issue | Steps to Reproduce | Expected | Actual | Severity |
|-------|-------------------|----------|--------|----------|
|       |                   |          |        |          |

## Environment Details
- Node.js version: ___________
- OS: ___________
- Browser: ___________
- Database version: ___________
- Redis version: ___________

