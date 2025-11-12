# 🚀 Quick Start Guide (5 Minutes)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate a secure secret
openssl rand -base64 32

# Edit .env and update:
nano .env
```

**Minimum required in `.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/indexing_insight"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<paste-the-generated-secret-here>"

# You'll add these after setting up Google OAuth:
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## Step 3: Set Up Database

```bash
# Make sure PostgreSQL is running
# Then create database (adjust username/password as needed):

# Option A: Using psql
psql -U postgres -c "CREATE DATABASE indexing_insight;"

# Option B: If you have a different setup
# Update DATABASE_URL in .env with your credentials

# Push database schema
npm run db:push
```

## Step 4: Set Up Google OAuth

This is **required** for authentication to work:

1. Go to: https://console.cloud.google.com/
2. Create or select a project
3. Enable APIs:
   - Go to "APIs & Services" > "Library"
   - Search and enable "Google Search Console API"
4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Save and copy the Client ID and Secret
5. Update `.env` with your credentials

## Step 5: Start the Application

**Terminal 1 - Start Next.js:**
```bash
npm run dev
```

**Terminal 2 - Start Background Worker:**
```bash
npm run worker
```

## Step 6: Open Browser

Go to: **http://localhost:3000**

---

## Testing the Application

### 1. Sign In
- Click "Sign in with Google"
- Authorize the application
- You'll be redirected to the dashboard

### 2. Create a Project
- Click "New Project"
- Fill in:
  - Name: "My Test Site"
  - Domain: "https://yoursite.com"
  - Search Console Property: "sc-domain:yoursite.com"
- Submit

### 3. Add URLs
- Click "Add URLs"
- Try single URL: `https://yoursite.com/test`
- Or bulk import multiple URLs

### 4. View Dashboard
- See statistics
- Browse URL list
- Check indexing status

---

## Troubleshooting

### "Unauthorized" Error
→ Make sure you're signed in with Google

### Database Connection Error
→ Check DATABASE_URL in `.env`
→ Verify PostgreSQL is running

### Redis Connection Error
→ Check Redis is running: `redis-cli ping`
→ Should return "PONG"

### Google OAuth Not Working
→ Verify redirect URI matches exactly
→ Check Client ID/Secret in `.env`
→ Make sure Search Console API is enabled

---

## Useful Commands

```bash
# View database in GUI
npm run db:studio

# Check Redis connection
redis-cli ping

# View logs
# Check both terminals running dev and worker

# Reset database
npm run db:push -- --force-reset
```

---

## What's Next?

Once basic features work:
- Import real URLs from your site
- Check indexing status
- View historical data
- Set up alerts (Phase 2)

See **TESTING.md** for detailed testing guide.
