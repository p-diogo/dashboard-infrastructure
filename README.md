# The Graph Dashboards Infrastructure

> Unified deployment infrastructure for The Graph Protocol monitoring dashboards.

## What is this?

A single Docker Compose setup that runs multiple monitoring dashboards:
- **🪿 Grumpy Goose** - Governance oversight and operational monitoring
- **🍪 Rewards Eligibility Oracle** - Indexer eligibility monitoring (GIP-0079)

**Quick access:** [hub.thegraph.foundation](https://hub.thegraph.foundation)

## Quick Start

```bash
# Deploy everything
./deploy.sh

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

That's it! The dashboards will be available at:
- **Hub**: http://localhost/
- **Grumpy Goose**: http://localhost/goose
- **REO**: http://localhost/reo (requires authentication)

## Prerequisites

- Docker and Docker Compose
- Environment files in sibling directories:
  - `../grumpygoose/.env`
  - `../rewards-eligibility-oracle-dashboard/.env`

## What's Included?

- **Nginx** web server (port 80)
- **Auth Gate** (OTP authentication for REO)
- Dashboard generators and schedulers
- Automated health checks

## Documentation

**For humans:**
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Authentication Setup](docs/AUTHENTICATION.md) - Configure OTP access for REO

**For AI agents:**
- [CLAUDE.md](CLAUDE.md) - Development workflow and project structure

## Development

```bash
# Restart Nginx after config changes
docker compose restart nginx

# Run E2E tests
cd infrastructure/tests/e2e && npm test
```

## Troubleshooting

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f <service-name>

# Restart a service
docker compose restart <service-name>
```

## App Repositories

This infrastructure orchestrates:
- [Grumpy Goose](https://github.com/graphprotocol/grumpygoose)
- [Rewards Eligibility Oracle](https://github.com/graphprotocol/rewards-eligibility-oracle-dashboard)

---

**Need help?** Check the [docs](docs/) folder or [CLAUDE.md](CLAUDE.md)
