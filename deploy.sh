#!/bin/bash
# Deployment script for The Graph Dashboards Infrastructure
# Deploys Nginx + Grumpy Goose + Rewards Eligibility Oracle
#
# Usage:
#   ./deploy.sh                    # Deploy all services
#   ./deploy.sh --skip-reo         # Skip REO deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SKIP_REO=false
SKIP_GOOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-reo)
            SKIP_REO=true
            shift
            ;;
        --skip-goose)
            SKIP_GOOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-reo      Skip Rewards Eligibility Oracle deployment"
            echo "  --skip-goose    Skip Grumpy Goose deployment"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   The Graph Dashboards - Infrastructure Deployment   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose is not available${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are available${NC}"
echo ""

# Check if required files exist
if [ ! -f "infrastructure/nginx/nginx.conf" ]; then
    echo -e "${RED}❌ Error: infrastructure/nginx/nginx.conf not found${NC}"
    exit 1
fi

if [ ! -f "infrastructure/nginx/hub/index.html" ]; then
    echo -e "${RED}❌ Error: infrastructure/nginx/hub/index.html not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration files found${NC}"
echo ""

# Check if .env files exist
if [ "$SKIP_REO" = false ] && [ ! -f "../rewards-eligibility-oracle-dashboard/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: REO .env file not found at ../rewards-eligibility-oracle-dashboard/.env${NC}"
    echo "REO scheduler will not work without environment variables"
fi

if [ "$SKIP_GOOSE" = false ] && [ ! -f "../grumpygoose/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: Grumpy Goose .env file not found at ../grumpygoose/.env${NC}"
    echo "Grumpy Goose scheduler will not work without environment variables"
fi

echo ""
echo "📦 Deployment plan:"
echo "   - Nginx (hub + routing)"
if [ "$SKIP_GOOSE" = false ]; then
    echo "   - Grumpy Goose (generator + scheduler)"
else
    echo "   - Grumpy Goose (skipped)"
fi
if [ "$SKIP_REO" = false ]; then
    echo "   - Rewards Eligibility Oracle (generator + scheduler)"
else
    echo "   - Rewards Eligibility Oracle (skipped)"
fi
echo ""

# Prompt for confirmation
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "🛑 Stopping existing containers..."
docker compose down

echo ""
echo "📥 Pulling latest images..."
if [ "$SKIP_GOOSE" = false ]; then
    docker pull ghcr.io/graphprotocol/grumpygoose:latest
fi
if [ "$SKIP_REO" = false ]; then
    # Check if REO image exists locally (may not be pushed yet)
    if docker images | grep -q "rewards-eligibility-oracle"; then
        echo "ℹ️  Using local REO image"
    else
        echo "⚠️  REO image not found in registry, attempting to pull..."
        docker pull ghcr.io/graphprotocol/rewards-eligibility-oracle:latest || echo "⚠️  Using local image"
    fi
fi

echo ""
echo "🚀 Starting containers..."
COMPOSE_PROFILES=""
if [ "$SKIP_REO" = false ]; then
    # We'll control REO separately
    :
fi
if [ "$SKIP_GOOSE" = false ]; then
    :
fi

# Start with profiles to control which services run
docker compose up -d

# Stop services that should be skipped
if [ "$SKIP_REO" = true ]; then
    echo ""
    echo "🛑 Stopping REO services..."
    docker compose stop reo reo-scheduler 2>/dev/null || true
fi

if [ "$SKIP_GOOSE" = true ]; then
    echo ""
    echo "🛑 Stopping Grumpy Goose services..."
    docker compose stop grumpygoose grumpygoose-scheduler 2>/dev/null || true
fi

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Container status:"
docker compose ps

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Access dashboards at:"
echo "   - Hub:           http://localhost/ (or http://dashboards.thegraph.foundation/)"
if [ "$SKIP_GOOSE" = false ]; then
    echo "   - Grumpy Goose:  http://localhost/goose"
fi
if [ "$SKIP_REO" = false ]; then
    echo "   - REO:           http://localhost/reo"
fi
echo ""
echo "📝 View logs:"
echo "   docker compose logs -f"
echo ""
echo "🔍 View specific logs:"
if [ "$SKIP_GOOSE" = false ]; then
    echo "   docker compose logs -f grumpygoose-scheduler"
fi
if [ "$SKIP_REO" = false ]; then
    echo "   docker compose logs -f reo-scheduler"
fi
echo ""
echo "🛑 Stop all services:"
echo "   docker compose down"
