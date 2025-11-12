#!/bin/bash

# Mock Testing Script - Test without Google Search Console
# This creates sample data for testing the UI and features

echo "🧪 Mock Testing - Indexing Insight Clone"
echo "========================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Development server is not running!"
    echo "Please start it with: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

echo "This script will help you test the application features:"
echo ""
echo "1. Install dependencies (if needed)"
echo "2. Set up database"
echo "3. View the application URLs"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🗄️  Database setup..."
echo ""
echo "Run these commands to set up your database:"
echo ""
echo "  npm run db:push"
echo ""

echo "🌐 Application URLs:"
echo ""
echo "  Main App:     http://localhost:3000"
echo "  Sign In:      http://localhost:3000/signin"
echo "  Dashboard:    http://localhost:3000/dashboard"
echo "  Prisma Studio: http://localhost:5555 (run: npm run db:studio)"
echo ""

echo "📝 Quick Testing Checklist:"
echo ""
echo "  [ ] Sign in with Google OAuth"
echo "  [ ] Create a project"
echo "  [ ] Add a single URL"
echo "  [ ] Add multiple URLs (bulk)"
echo "  [ ] View URL list"
echo "  [ ] Check dashboard statistics"
echo "  [ ] View URL details"
echo ""

echo "💡 Pro Tips:"
echo ""
echo "  • Use Prisma Studio to inspect your database:"
echo "    npm run db:studio"
echo ""
echo "  • Check application logs in the terminal running 'npm run dev'"
echo ""
echo "  • Check worker logs in the terminal running 'npm run worker'"
echo ""
echo "  • For API testing, see TESTING.md"
echo ""
