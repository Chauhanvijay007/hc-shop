# Indexing Insight Clone

A Google Indexing monitoring tool that helps SEO professionals track and analyze the indexing status of large-scale websites using Google's URL Inspection API.

## Features

- **URL Monitoring**: Track up to 1 million URLs with automated daily checks
- **Google URL Inspection API Integration**: Real-time indexing status from Google Search Console
- **Historical Tracking**: Store and visualize indexing changes over time
- **Advanced Filtering**: Filter by status, date ranges, URL patterns, and more
- **Alerts & Notifications**: Email alerts when URLs drop from index or encounter errors
- **Reports & Export**: Automated daily/weekly reports and data export (CSV, JSON, Excel, PDF)
- **Dashboard Analytics**: Visual insights with charts and trend analysis

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ (Redis-based) for background jobs
- **Auth**: NextAuth.js with Google OAuth
- **Email**: Resend
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis server
- Google Cloud Console project with Search Console API enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hc-shop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:
- Database connection string
- Redis URL
- Google OAuth credentials
- NextAuth secret
- Resend API key

4. Set up the database:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

6. In a separate terminal, start the background worker:
```bash
npm run worker
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Search Console API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Client Secret to your `.env` file

## Project Structure

```
/src
  /app                    # Next.js 14 app directory
    /api                  # API routes
    /dashboard            # Dashboard pages
    /projects             # Project pages
    /(auth)               # Auth pages
  /components
    /ui                   # shadcn/ui components
    /dashboard            # Dashboard components
    /tables               # Data table components
    /charts               # Chart components
  /lib
    /db                   # Database utilities
    /google-api           # Google API integration
    /queue                # Job queue setup
    /email                # Email utilities
  /types                  # TypeScript types
  /hooks                  # Custom React hooks
/prisma
  schema.prisma           # Database schema
/workers                  # Background job processors
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma Client
- `npm run worker` - Start background job worker

## Database Schema

Key tables:
- `users` - User accounts with OAuth tokens
- `projects` - Projects/sites to monitor
- `urls` - URLs to track with metadata
- `indexing_checks` - Historical indexing check results (time-series)
- `status_changes` - Log of status changes
- `alerts` - Alert rules and configuration
- `alert_history` - Triggered alerts log
- `monitoring_queue` - Job queue for URL checks

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with Google
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### URLs
- `GET /api/projects/:id/urls` - List URLs (with filters)
- `POST /api/projects/:id/urls` - Add URLs
- `POST /api/projects/:id/urls/bulk` - Bulk import from CSV
- `POST /api/projects/:id/urls/sitemap` - Import from sitemap
- `PATCH /api/projects/:id/urls/:urlId` - Update URL
- `DELETE /api/projects/:id/urls/:urlId` - Delete URL

## Development Phases

### Phase 1: MVP (Current) ✅
- User authentication
- Basic project creation
- URL import (CSV, manual)
- Google URL Inspection API integration
- Basic dashboard with stats
- URL list view with basic filters

### Phase 2: Monitoring & Automation
- Background job queue
- Automated daily monitoring
- Historical data storage
- Status change detection
- Email alerts

### Phase 3: Advanced Features
- Sitemap import
- Advanced filtering & segmentation
- URL grouping and tagging
- Trend visualization
- Multiple alert types

### Phase 4: Polish & Scale
- Data export functionality
- Performance optimization
- UI/UX refinements
- Testing & documentation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
