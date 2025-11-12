# Complete Setup Guide - Indexing Insight Clone

This guide will walk you through setting up the entire application from scratch, including all dependencies, services, and configurations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Database Setup](#database-setup)
5. [Redis Setup](#redis-setup)
6. [Google OAuth Configuration](#google-oauth-configuration)
7. [Email Service Setup](#email-service-setup)
8. [Environment Configuration](#environment-configuration)
9. [Running the Application](#running-the-application)
10. [Verification & Testing](#verification--testing)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v18.17 or higher)
   ```bash
   # Check version
   node --version

   # Download from: https://nodejs.org/
   ```

2. **npm** (v9.0 or higher) - comes with Node.js
   ```bash
   npm --version
   ```

3. **PostgreSQL** (v14 or higher)
   ```bash
   # Check version
   psql --version

   # Download from: https://www.postgresql.org/download/
   ```

4. **Redis** (v6.0 or higher)
   ```bash
   # Check version
   redis-server --version

   # Download from: https://redis.io/download/
   ```

5. **Git**
   ```bash
   git --version
   ```

### Optional but Recommended

- **VS Code** - For code editing
- **Postman** or **Insomnia** - For API testing
- **TablePlus** or **pgAdmin** - For database management

---

## System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 10 GB free space
- OS: macOS, Linux, or Windows 10+

**Recommended**:
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 20+ GB free space
- Fast internet connection

---

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Chauhanvijay007/hc-shop.git

# Navigate to project directory
cd hc-shop

# Checkout the correct branch
git checkout claude/indexing-insight-clone-setup-011CV3j8y6T1cjMnGzadkUY5
```

### 2. Install Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - Next.js, React, TypeScript
# - Prisma, PostgreSQL client
# - BullMQ, Redis client
# - NextAuth, Google APIs
# - Resend, Email libraries
# - UI components and utilities
```

**Expected output**: Should install 200+ packages without errors.

---

## Database Setup

### Option 1: Local PostgreSQL Installation

#### macOS (using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
createdb indexing_insight

# Verify connection
psql indexing_insight
```

#### Ubuntu/Debian Linux

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -i -u postgres

# Create database and user
createuser --interactive --pwprompt
# Username: indexing_user
# Password: your_secure_password

createdb indexing_insight -O indexing_user

# Exit postgres user
exit
```

#### Windows

1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run installer and follow wizard
3. Remember the password you set for `postgres` user
4. Open SQL Shell (psql) from Start Menu
5. Create database:
   ```sql
   CREATE DATABASE indexing_insight;
   ```

### Option 2: Cloud PostgreSQL (Recommended for Production)

#### Using Supabase (Free Tier Available)

1. Go to https://supabase.com/
2. Sign up for free account
3. Create new project
4. Wait for database provisioning (~2 minutes)
5. Go to Settings > Database
6. Copy the "Connection string" (URI format)
7. Use this as your `DATABASE_URL`

#### Using Railway (Free Tier Available)

1. Go to https://railway.app/
2. Sign up with GitHub
3. New Project > Provision PostgreSQL
4. Copy the `DATABASE_URL` from Variables tab

#### Using Neon (Free Tier Available)

1. Go to https://neon.tech/
2. Sign up for free
3. Create new project
4. Copy connection string

### Verify Database Connection

```bash
# Test connection with psql
psql "postgresql://user:password@localhost:5432/indexing_insight"

# Or for cloud databases
psql "your-connection-string-here"
```

---

## Redis Setup

### Option 1: Local Redis Installation

#### macOS (using Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Ubuntu/Debian Linux

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Windows

1. Download Redis from https://github.com/microsoftarchive/redis/releases
2. Extract to `C:\Redis`
3. Run `redis-server.exe`
4. Test with `redis-cli.exe ping`

**Or use WSL2** (Recommended):
```bash
# In WSL2
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli ping
```

### Option 2: Cloud Redis (Recommended for Production)

#### Using Upstash (Free Tier Available)

1. Go to https://upstash.com/
2. Sign up for free account
3. Create Redis database
4. Select region closest to your application
5. Copy the `UPSTASH_REDIS_URL`
6. Use as `REDIS_URL` in .env

#### Using Redis Cloud

1. Go to https://redis.com/try-free/
2. Create free account
3. Create database
4. Copy connection string

### Verify Redis Connection

```bash
# Test local Redis
redis-cli
> SET test "Hello"
> GET test
> exit

# Test cloud Redis (Upstash)
redis-cli -u "your-redis-url-here"
```

---

## Google OAuth Configuration

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: "Indexing Insight Clone"
4. Click "Create"

### 2. Enable Required APIs

1. In the project, go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Google Search Console API**
   - **Google+ API** (for OAuth)

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. User Type: Select **External**
3. Click **Create**
4. Fill in required fields:
   - App name: `Indexing Insight Clone`
   - User support email: Your email
   - Developer contact: Your email
5. Click **Save and Continue**
6. **Scopes**: Click **Add or Remove Scopes**
   - Add: `email`
   - Add: `profile`
   - Add: `openid`
   - Add: `https://www.googleapis.com/auth/webmasters.readonly`
7. Click **Save and Continue**
8. **Test users**: Add your email address
9. Click **Save and Continue**

### 4. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Indexing Insight Web Client`
5. **Authorized JavaScript origins**:
   - Add: `http://localhost:3000`
   - Add: `http://localhost:3001` (if using different port)
   - Add your production domain when ready
6. **Authorized redirect URIs**:
   - Add: `http://localhost:3000/api/auth/callback/google`
   - Add your production callback URL when ready
7. Click **Create**
8. **Copy the Client ID and Client Secret** - you'll need these!

### 5. Enable Search Console Access

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your website property
3. Verify ownership
4. Grant access to the email you'll use for OAuth

---

## Email Service Setup

We use Resend for transactional emails (alerts and reports).

### 1. Create Resend Account

1. Go to https://resend.com/
2. Sign up for free account
3. Verify your email address

### 2. Add Domain (Optional but Recommended)

**For Production**:
1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the provided DNS records to your domain provider
5. Wait for verification (can take up to 48 hours)

**For Development**:
- You can skip this and use the default `onboarding@resend.dev` sender
- But emails will have "via resend.dev" warning

### 3. Get API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name: `Indexing Insight Clone`
4. Permission: **Full Access** (or **Sending Access** only)
5. Click **Create**
6. **Copy the API key** - it will only be shown once!

### 4. Verify Email Template

1. Go to **Emails** → **Send Test**
2. Test the API with a sample email
3. Check your inbox to verify delivery

---

## Environment Configuration

### 1. Create .env File

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file
nano .env
# or
code .env
```

### 2. Fill in Environment Variables

```env
# ============================================
# DATABASE
# ============================================
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/indexing_insight"

# OR Cloud Database (Supabase example)
# DATABASE_URL="postgresql://postgres:your-password@db.abc.supabase.co:5432/postgres"

# OR Railway/Neon
# DATABASE_URL="postgresql://user:pass@host:port/dbname"


# ============================================
# REDIS
# ============================================
# Local Redis
REDIS_URL="redis://localhost:6379"

# OR Cloud Redis (Upstash example)
# REDIS_URL="rediss://:your-password@region.upstash.io:6379"


# ============================================
# AUTHENTICATION
# ============================================
# For development
NEXTAUTH_URL="http://localhost:3000"

# For production (when deploying)
# NEXTAUTH_URL="https://yourdomain.com"

# Generate a secure secret (use one of these methods):
# Method 1: openssl rand -base64 32
# Method 2: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET="your-generated-secret-here-change-this"


# ============================================
# GOOGLE OAUTH & APIS
# ============================================
# From Google Cloud Console (step above)
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret-here"


# ============================================
# EMAIL (RESEND)
# ============================================
# From Resend dashboard (step above)
RESEND_API_KEY="re_123456789_abcdefghijklmnop"

# Email sender address
# For production with verified domain:
EMAIL_FROM="noreply@yourdomain.com"

# For development:
# EMAIL_FROM="onboarding@resend.dev"


# ============================================
# APPLICATION
# ============================================
NODE_ENV="development"

# Must match NEXTAUTH_URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Generate Secure Secret

**Option 1: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online Generator**
- Go to https://generate-secret.vercel.app/32
- Copy the generated secret

**Important**: Never commit your `.env` file to git! It's already in `.gitignore`.

### 4. Verify Environment Variables

```bash
# Check all required variables are set
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'); console.log('REDIS_URL:', process.env.REDIS_URL ? '✓ Set' : '✗ Missing'); console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✓ Set' : '✗ Missing'); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing'); console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing');"
```

---

## Running the Application

### 1. Initialize Database Schema

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# Expected output:
# ✓ Generated Prisma Client
# ✓ The database is now in sync with the Prisma schema
```

**Verify tables were created**:
```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Opens browser at http://localhost:5555
# You should see all 11 models/tables
```

### 2. Start Required Services

**Terminal 1: Redis Server** (if running locally)
```bash
# macOS/Linux
redis-server

# Windows (in Redis directory)
redis-server.exe

# Expected output:
# Ready to accept connections on port 6379
```

**Terminal 2: PostgreSQL** (if not already running as service)
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Windows - should be running as service already
```

### 3. Start Development Server

**Terminal 3: Next.js Application**
```bash
npm run dev

# Expected output:
# ✓ Ready in 3.5s
# ○ Local:   http://localhost:3000
# ○ Network: http://192.168.1.x:3000
```

### 4. Start Background Workers

**Terminal 4: Worker Process**
```bash
npm run worker

# Expected output:
# 🚀 Starting Indexing Insight Workers...
# =====================================
#
# ✅ 5 workers started:
#    - URL Inspection Worker
#    - Bulk Check Worker
#    - Alert Check Worker
#    - Daily Report Worker
#    - Weekly Report Worker
#
# 📅 Starting schedulers...
# 🚀 Daily monitoring scheduler started (runs at 2 AM UTC)
# 🚀 Weekly monitoring scheduler started (runs Monday 2 AM UTC)
# 🚀 Daily report scheduler started (runs at 8 AM UTC)
# 🚀 Weekly report scheduler started (runs Monday 9 AM UTC)
#    - Daily monitoring: next run at [timestamp]
#    - Weekly monitoring: next run at [timestamp]
#    - Daily report: next run at [timestamp]
#    - Weekly report: next run at [timestamp]
#
# ✅ All workers and schedulers are running!
# =====================================
```

**All 4 terminals should be running**:
1. Redis server
2. PostgreSQL (if not service)
3. Next.js dev server (port 3000)
4. Worker process

---

## Verification & Testing

### 1. Access the Application

Open browser and go to:
```
http://localhost:3000
```

You should see the application homepage/sign-in page.

### 2. Test Authentication

1. Click **Sign in with Google**
2. Select your Google account
3. Grant permissions when prompted
4. You should be redirected to dashboard

### 3. Create First Project

1. Click **New Project** or **Create Project**
2. Fill in project details:
   - Name: `Test Project`
   - Site URL: `https://example.com`
   - Monitoring Frequency: `Daily`
3. Click **Create**

### 4. Add Test URLs

**Option 1: Manual Entry**
1. Go to project → **URLs**
2. Click **Add URL**
3. Enter URL: `https://example.com/page1`
4. Click **Add**

**Option 2: Bulk Import**
1. Click **Bulk Import**
2. Paste multiple URLs (one per line):
   ```
   https://example.com/page1
   https://example.com/page2
   https://example.com/page3
   ```
3. Click **Import**

**Option 3: Sitemap Import** ✨ NEW
1. Click **Import from Sitemap**
2. Enter sitemap URL: `https://example.com/sitemap.xml`
3. Click **Import**
4. Wait for processing

### 5. Test URL Inspection

1. Select a URL from the list
2. Click **Check Now** or similar button
3. Watch worker terminal - you should see:
   ```
   📋 [Job 1] Processing URL inspection...
   ✅ [Job 1] URL inspection completed
   ```
4. Refresh page - URL status should update

### 6. Test Alerts

1. Go to **Alerts** section
2. Click **Create Alert**
3. Fill in:
   - Name: `Test Alert`
   - Type: `url_dropped`
   - Active: `Yes`
4. Create alert
5. Trigger status change (check a URL that changes state)
6. Check email inbox for alert

### 7. Test Saved Filters

1. Go to **Filters** or **URLs** section
2. Apply some filters (e.g., only show "not indexed" URLs)
3. Click **Save Filter**
4. Name: `Not Indexed URLs`
5. Save and verify it appears in saved filters list

### 8. Test Trends

1. Go to **Dashboard** or **Analytics**
2. Look for trends chart/graph
3. Should show indexing statistics over time
4. Or test API directly:
   ```bash
   curl "http://localhost:3000/api/projects/YOUR_PROJECT_ID/trends?days=7" \
     -H "Cookie: YOUR_SESSION_COOKIE"
   ```

### 9. Verify Worker Health

Check worker terminal for activity:
```
✅ URL inspection worker processing job
✅ Alert check completed
✅ Daily monitoring job completed
```

### 10. Check Database

```bash
# Open Prisma Studio
npm run db:studio

# Verify data in tables:
# - users
# - projects
# - urls
# - indexing_checks
# - status_changes
# - alerts
```

---

## API Testing

### Get Session Cookie

1. Sign in to application in browser
2. Open Developer Tools (F12)
3. Go to Application/Storage → Cookies
4. Copy the cookie value (usually `next-auth.session-token`)

### Test API Endpoints

```bash
# Replace YOUR_PROJECT_ID and YOUR_SESSION_COOKIE

# Get project stats
curl "http://localhost:3000/api/projects/YOUR_PROJECT_ID/stats" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_COOKIE"

# Get trends
curl "http://localhost:3000/api/projects/YOUR_PROJECT_ID/trends?days=30" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_COOKIE"

# List saved filters
curl "http://localhost:3000/api/projects/YOUR_PROJECT_ID/filters" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_COOKIE"

# List alerts
curl "http://localhost:3000/api/projects/YOUR_PROJECT_ID/alerts" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_COOKIE"

# Import from sitemap
curl -X POST "http://localhost:3000/api/projects/YOUR_PROJECT_ID/urls/sitemap" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_COOKIE" \
  -d '{"sitemapUrl": "https://example.com/sitemap.xml"}'
```

---

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors

```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. "Can't connect to database"

```bash
# Check PostgreSQL is running
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Test connection
psql "postgresql://user:password@localhost:5432/indexing_insight"

# Check DATABASE_URL in .env is correct
```

#### 3. "Can't connect to Redis"

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Check REDIS_URL in .env is correct
```

#### 4. "NextAuth configuration error"

```bash
# Verify these in .env:
# - NEXTAUTH_URL matches your dev server URL
# - NEXTAUTH_SECRET is set and not empty
# - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

# Make sure OAuth redirect URI in Google Console matches:
# http://localhost:3000/api/auth/callback/google
```

#### 5. Workers not processing jobs

```bash
# Check worker terminal is running
# Restart workers:
# Press Ctrl+C in worker terminal
npm run worker

# Check Redis connection
redis-cli
> KEYS *
> exit

# Should see BullMQ queues
```

#### 6. Emails not sending

```bash
# Check RESEND_API_KEY in .env is correct
# Check EMAIL_FROM is valid
# Verify in Resend dashboard:
# - API key is active
# - Domain is verified (for production)
# - Check "Logs" section for errors
```

#### 7. Google API errors

```bash
# Verify APIs are enabled in Google Cloud Console:
# - Google Search Console API
# - Google+ API

# Check scopes in OAuth consent screen include:
# - https://www.googleapis.com/auth/webmasters.readonly

# Try re-authenticating:
# - Sign out
# - Clear cookies
# - Sign in again
```

#### 8. Port already in use

```bash
# If port 3000 is in use
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use different port
npm run dev -- -p 3001
```

#### 9. Prisma schema sync issues

```bash
# Reset database (WARNING: deletes all data)
npm run db:push -- --force-reset

# Or migrate properly
npx prisma migrate dev --name init
```

#### 10. TypeScript errors

```bash
# Regenerate Prisma types
npm run db:generate

# Restart VS Code TypeScript server
# In VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Getting Help

If you're still stuck:

1. **Check Logs**:
   - Next.js terminal for API errors
   - Worker terminal for queue/job errors
   - Browser console for frontend errors

2. **Enable Debug Mode**:
   ```env
   # Add to .env
   DEBUG=*
   NODE_ENV=development
   ```

3. **Documentation**:
   - `PHASE_3_TESTING.md` - Testing guide
   - `API_QUICK_REFERENCE.md` - API examples
   - `IMPLEMENTATION_SUMMARY.md` - Architecture overview

4. **Database Inspection**:
   ```bash
   npm run db:studio
   # Opens GUI at http://localhost:5555
   ```

---

## Production Deployment

### Environment Checklist

Before deploying to production:

- [ ] Use production database (not local)
- [ ] Use production Redis (not local)
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Set correct `NEXTAUTH_URL` (your domain)
- [ ] Set correct `NEXT_PUBLIC_APP_URL`
- [ ] Verify domain in Resend
- [ ] Update Google OAuth redirect URIs
- [ ] Enable SSL/HTTPS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set up error tracking (Sentry)

### Deployment Platforms

**Recommended**: Vercel (for Next.js) + Railway/Supabase (for DB/Redis)

1. **Vercel** - Frontend & API
   - Connect GitHub repository
   - Add environment variables
   - Deploy automatically on push

2. **Railway** - Database & Redis
   - Provision PostgreSQL
   - Provision Redis
   - Copy connection strings to Vercel

3. **Alternative**: Render, Fly.io, DigitalOcean App Platform

### Worker Deployment

Workers need separate hosting:

- **Railway** - Run as separate service
- **Render** - Background worker service
- **DigitalOcean** - Droplet with PM2
- **AWS EC2** - T3.small instance

---

## Next Steps

Now that everything is set up:

1. **Explore Features**:
   - Create multiple projects
   - Import URLs via sitemap
   - Set up monitoring schedules
   - Configure alerts
   - Save custom filters
   - View trend analytics

2. **Customize**:
   - Modify email templates in `src/lib/email/`
   - Adjust scheduler times in `src/lib/scheduler/`
   - Configure rate limits in workers

3. **Monitor**:
   - Watch worker logs
   - Check queue health in Redis
   - Monitor database performance
   - Review email delivery in Resend

4. **Scale**:
   - Add more worker instances
   - Optimize database queries
   - Set up Redis cluster
   - Implement caching

---

## Summary

You should now have:

✅ PostgreSQL database running with schema
✅ Redis server running for queues
✅ Next.js application running on port 3000
✅ Worker process running with 5 workers and 4 schedulers
✅ Google OAuth configured for authentication
✅ Resend configured for email delivery
✅ All environment variables set correctly

**Access Points**:
- Application: http://localhost:3000
- Database GUI: http://localhost:5555 (Prisma Studio)
- Redis CLI: `redis-cli`

**All Features Available**:
- ✅ User authentication with Google
- ✅ Project & URL management
- ✅ Google URL Inspection API integration
- ✅ Automated monitoring (daily/weekly)
- ✅ Background job processing
- ✅ Email alerts (6 types)
- ✅ Sitemap import
- ✅ Saved filters
- ✅ Trend analytics
- ✅ Email reports (daily/weekly)

**Happy monitoring! 🚀**

For detailed API testing, see `PHASE_3_TESTING.md`
For architecture details, see `IMPLEMENTATION_SUMMARY.md`
For quick API reference, see `API_QUICK_REFERENCE.md`
