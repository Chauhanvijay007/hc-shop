# SEO Gets Clone

A comprehensive Google Search Console (GSC) analytics platform built with Next.js 14, providing enhanced features, multi-site management, and advanced SEO insights.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with Google OAuth
- **Data Visualization:** Recharts
- **State Management:** TanStack Query (React Query)

## Features (Phase 1 - MVP) ✅ COMPLETE

### Core Features
- ✅ Google OAuth authentication with GSC API access
- ✅ Multi-site property management
- ✅ Master dashboard with property overview
- ✅ GSC data integration service (batch fetching up to 50k rows)
- ✅ Property connection flow with tags and branded keywords
- ✅ User authentication and session management
- ✅ Responsive dashboard UI with sidebar navigation

### Analytics & Visualization
- ✅ Timeline chart with Recharts (clicks, impressions, CTR, position)
- ✅ Interactive metric toggling
- ✅ Property detail pages with key metrics
- ✅ Daily snapshot aggregations

### Filtering & Export
- ✅ Date range filtering (7d, 30d, 90d, 6m, 1y)
- ✅ Device filtering (desktop, mobile, tablet)
- ✅ Country filtering
- ✅ CSV export functionality (up to 50k rows)
- ✅ Downloadable analytics data

### Background Jobs
- ✅ Automated data sync system (Vercel Cron)
- ✅ Manual sync trigger
- ✅ Sync queue management
- ✅ Job status tracking

### 📋 Planned (Future Phases)
- Content Groups
- Topic Clusters
- Branded vs Non-branded tracking
- Advanced Reports (Heatmap, Cannibalization, Striking Distance, etc.)
- SEO Testing Framework
- Team Collaboration
- Magic Shared Links (Client Portals)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Console project with OAuth 2.0 credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hc-shop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Search Console API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret to `.env`

5. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── gsc/          # GSC API integration
│   │   └── properties/   # Property management
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main dashboard
│   └── properties/       # Property management pages
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client
├── prisma/                # Database schema
│   └── schema.prisma     # Prisma schema definition
├── services/              # Business logic services
│   └── gsc.service.ts    # Google Search Console service
└── types/                 # TypeScript type definitions

```

## Database Schema

The application uses PostgreSQL with the following main models:

- **User**: User accounts and profiles
- **Account**: OAuth account connections (Google)
- **Session**: User sessions
- **Property**: GSC properties
- **AnalyticsData**: Time-series GSC data
- **DailySnapshot**: Aggregated daily metrics
- **ContentGroup**: URL grouping rules
- **TopicCluster**: Keyword collections
- **Annotation**: Custom annotations and Google updates
- **SavedFilter**: Saved filter configurations
- **SeoTest**: A/B testing experiments
- **MagicLink**: Shareable client portals
- **TeamMember**: Team collaboration

## API Endpoints

### Authentication
- `GET /api/auth/signin` - Sign in page
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Properties
- `GET /api/properties` - List user properties
- `POST /api/properties` - Add new property
- `GET /api/properties/[id]` - Get property details with stats
- `GET /api/gsc/properties` - Fetch GSC properties from Google
- `POST /api/gsc/sync` - Sync property data from GSC

### Analytics
- `GET /api/analytics/timeline` - Get timeline chart data with filters
- `GET /api/analytics/branded` - Get branded vs non-branded analytics

### Content Groups
- `GET /api/content-groups` - List content groups
- `POST /api/content-groups` - Create content group
- `GET /api/content-groups/[id]` - Get content group
- `PUT /api/content-groups/[id]` - Update content group
- `DELETE /api/content-groups/[id]` - Delete content group

### Topic Clusters
- `GET /api/topic-clusters` - List topic clusters
- `POST /api/topic-clusters` - Create topic cluster
- `GET /api/topic-clusters/[id]` - Get cluster with stats
- `PUT /api/topic-clusters/[id]` - Update cluster
- `DELETE /api/topic-clusters/[id]` - Delete cluster

### Saved Filters
- `GET /api/filters` - List saved filters
- `POST /api/filters` - Create saved filter

### Annotations
- `GET /api/annotations` - List annotations
- `POST /api/annotations` - Create annotation
- `PUT /api/annotations/[id]` - Update annotation
- `DELETE /api/annotations/[id]` - Delete annotation

### Export
- `POST /api/export/csv` - Export data to CSV

### Background Jobs
- `GET /api/cron/sync` - Automated sync endpoint (cron job)
- `GET /api/sync/status/[jobId]` - Check sync job status

## Development Roadmap

### Phase 1: MVP ✅ COMPLETED
- [x] Authentication (Google OAuth)
- [x] Connect GSC properties
- [x] Basic dashboard
- [x] Property management
- [x] GSC API integration
- [x] Timeline chart
- [x] Data sync job
- [x] Basic filtering
- [x] CSV export

### Phase 2: Enhanced Analytics ✅ COMPLETED
- [x] Content Groups (URL pattern matching with visual builder)
- [x] Topic Clusters (Keyword grouping and management)
- [x] Branded vs Non-branded tracking (Separate analytics)
- [x] Saved filters (Save and reuse filter combinations)
- [x] Custom annotations (Timeline annotations with types)

### Phase 3: Advanced Reports
- [ ] Heatmap Overview
- [ ] Keyword Cannibalization
- [ ] Striking Distance
- [ ] CTR Benchmark
- [ ] Growth/Decay Report

### Phase 4: Pro Features
- [ ] SEO Testing framework
- [ ] Magic Shared Links
- [ ] Google Sheets integration
- [ ] Team collaboration

### Phase 5: Polish & Scale
- [ ] Background jobs (Bull/BullMQ)
- [ ] Email reports
- [ ] API for external integrations
- [ ] Performance optimizations

## Contributing

This is a private project. Please contact the repository owner for contribution guidelines.

## License

Proprietary - All Rights Reserved

## Support

For issues and questions, please contact the development team.

---

**Built with ❤️ for AllEvents SEO Team**
