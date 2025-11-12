#!/bin/bash

# Indexing Insight Clone - Quick Setup Script
# This script helps you set up the development environment quickly

set -e

echo "🚀 Indexing Insight Clone - Setup Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📦 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is installed${NC}"

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}❌ Redis is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Redis is installed${NC}"

echo ""

# Check if PostgreSQL is running
echo "🔍 Checking services..."
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Starting...${NC}"
    sudo service postgresql start
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Redis is not running. Starting...${NC}"
    sudo service redis-server start || redis-server --daemonize yes
    sleep 2
fi

if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Failed to start Redis${NC}"
    exit 1
fi

echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env

    # Generate NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)

    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-secret-key-change-this-in-production/$SECRET/" .env
    else
        sed -i "s/your-secret-key-change-this-in-production/$SECRET/" .env
    fi

    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your:${NC}"
    echo "   - DATABASE_URL"
    echo "   - GOOGLE_CLIENT_ID"
    echo "   - GOOGLE_CLIENT_SECRET"
    echo ""
    echo "Press Enter to continue after updating .env..."
    read
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""

# Check if database exists
echo "🗄️  Setting up database..."
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='indexing_insight'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating database 'indexing_insight'..."
    sudo -u postgres psql -c "CREATE DATABASE indexing_insight;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER indexing_user WITH PASSWORD 'indexing_pass';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE indexing_insight TO indexing_user;" 2>/dev/null || true

    # Update DATABASE_URL in .env if using default
    if grep -q "postgresql://user:password@localhost:5432/indexing_insight" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|postgresql://user:password@localhost:5432/indexing_insight|postgresql://indexing_user:indexing_pass@localhost:5432/indexing_insight|" .env
        else
            sed -i "s|postgresql://user:password@localhost:5432/indexing_insight|postgresql://indexing_user:indexing_pass@localhost:5432/indexing_insight|" .env
        fi
    fi

    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database exists${NC}"
fi

echo ""

# Run Prisma migrations
echo "🔄 Pushing database schema..."
npm run db:push

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Make sure you've set up Google OAuth credentials:"
echo "   https://console.cloud.google.com/"
echo ""
echo "2. Update your .env file with:"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo ""
echo "3. Start the development server:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "4. In a separate terminal, start the worker:"
echo "   ${GREEN}npm run worker${NC}"
echo ""
echo "5. Open your browser:"
echo "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "📖 See TESTING.md for detailed testing instructions"
echo ""
