# Testing Guide - Indexing Insight Clone

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Local Services

**Start PostgreSQL** (if not running):
```bash
# Check if running
sudo service postgresql status

# Start if needed
sudo service postgresql start
```

**Start Redis** (if not running):
```bash
# Check if running
redis-cli ping

# Start if needed
sudo service redis-server start
# OR
redis-server --daemonize yes
```

### 3. Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In psql, run:
CREATE DATABASE indexing_insight;
CREATE USER indexing_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE indexing_insight TO indexing_user;
\q
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL="postgresql://indexing_user:your_password@localhost:5432/indexing_insight"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Set Up Google OAuth (Required for Authentication)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Search Console API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Search Console API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Client Secret to your `.env` file

### 6. Initialize Database

```bash
npm run db:push
```

This creates all tables in your database.

### 7. Start the Application

**Terminal 1 - Start Next.js server:**
```bash
npm run dev
```

**Terminal 2 - Start Background Worker:**
```bash
npm run worker
```

### 8. Access the Application

Open your browser and go to: **http://localhost:3000**

---

## Testing Workflow

### Step 1: Sign In
1. Click "Sign in with Google"
2. Authorize the application
3. You should be redirected to the dashboard

### Step 2: Create a Project
1. Click "New Project" or "Create Project"
2. Fill in:
   - **Name**: "My Website"
   - **Domain**: "https://example.com"
   - **Search Console Property**: "sc-domain:example.com" or "https://example.com/"
3. Click "Create Project"

### Step 3: Add URLs

**Option A - Single URL:**
1. Click "Add URLs"
2. Enter a URL: `https://example.com/test-page`
3. Click "Add URL"

**Option B - Bulk Import:**
1. Click "Add URLs" > "Bulk Import" tab
2. Paste multiple URLs (one per line):
   ```
   https://example.com/page1
   https://example.com/page2
   https://example.com/blog/post-1
   ```
3. Click "Add URLs"

### Step 4: Check URL Status
1. Go to "View All URLs"
2. Click "Details" on any URL
3. Or trigger manual check via API (see below)

### Step 5: View Dashboard
- See total URLs
- View indexing statistics
- Check recent changes

---

## Testing Without Google Search Console

If you don't have a verified Search Console property, you can still test most features:

### Mock Testing

Create a test script to add URLs and mock check results:

```bash
# Add this to your .env for development
NODE_ENV=development
```

I'll create a mock testing script for you...

---

## API Testing with cURL

### 1. Create a Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "domain": "https://example.com",
    "searchConsoleProperty": "https://example.com/"
  }' \
  --cookie-jar cookies.txt
```

### 2. Add URLs
```bash
# Get project ID from previous response, then:
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/urls \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/test",
    "priority": "high"
  }' \
  --cookie cookies.txt
```

### 3. Bulk Import
```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/urls/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/page1",
      "https://example.com/page2"
    ]
  }' \
  --cookie cookies.txt
```

### 4. Get Stats
```bash
curl http://localhost:3000/api/projects/PROJECT_ID/stats \
  --cookie cookies.txt
```

---

## Troubleshooting

### Issue: "Unauthorized" errors
**Solution:** Make sure you're signed in. The app requires authentication for all API calls.

### Issue: Database connection error
**Solution:**
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify DATABASE_URL in `.env`
- Test connection: `psql $DATABASE_URL`

### Issue: Redis connection error
**Solution:**
- Check Redis is running: `redis-cli ping` (should return "PONG")
- Start Redis: `sudo service redis-server start`

### Issue: Google OAuth not working
**Solution:**
- Verify redirect URI in Google Console matches exactly
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env`
- Make sure Google Search Console API is enabled

### Issue: Worker not processing jobs
**Solution:**
- Make sure Redis is running
- Check worker terminal for errors
- Verify REDIS_URL in `.env`

### Issue: Can't check URLs (Google API error)
**Solution:**
- You need a verified property in Google Search Console
- The authenticated user must have access to the Search Console property
- For testing, you can mock the responses (see Mock Testing section)

---

## Database Inspection

View your data using Prisma Studio:
```bash
npm run db:studio
```

This opens a GUI at http://localhost:5555 to browse your database.

---

## Logs and Debugging

### Enable detailed logs:
Add to `.env`:
```env
DEBUG=true
```

### Check application logs:
- Next.js server logs appear in Terminal 1
- Worker logs appear in Terminal 2

### Check specific tables:
```bash
sudo -u postgres psql indexing_insight

# List tables
\dt

# View users
SELECT * FROM users;

# View projects
SELECT * FROM projects;

# View URLs
SELECT * FROM urls LIMIT 10;

# View latest checks
SELECT * FROM indexing_checks ORDER BY checked_at DESC LIMIT 10;
```

---

## Performance Testing

### Test bulk import performance:
```bash
# Create file with 1000 URLs
for i in {1..1000}; do
  echo "https://example.com/page-$i"
done > urls.txt
```

Then import via the UI's bulk import feature.

---

## Next Steps After Testing

Once basic testing works:
1. Add your real Search Console property
2. Import actual URLs from your site
3. Set up monitoring schedule (Phase 2)
4. Configure email alerts (Phase 2)
5. Export data for analysis

---

## Need Help?

- Check logs in both terminals
- Use Prisma Studio to inspect database
- Verify environment variables are set correctly
- Make sure all services (PostgreSQL, Redis) are running
