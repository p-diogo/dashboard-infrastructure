# The Graph Dashboards Infrastructure

Unified deployment infrastructure for The Graph Protocol monitoring dashboards.

## Dashboards

- **🪿 Grumpy Goose** - Governance oversight and operational monitoring
- **🍪 Rewards Eligibility Oracle** - Indexer eligibility monitoring (GIP-0079)

## Architecture

```
┌─────────────────────────────────────────────┐
│              Nginx (port 80)                 │
│  Serves: / → hub, /goose, /reo              │
└─────────────────────────────────────────────┘
           │                │
    ┌──────┴────────┐       │
    │               │       │
    ▼               ▼       ▼
┌─────────┐   ┌─────────┐
│ Volume  │   │ Volume  │
│ /gg     │   │ /reo    │
└─────────┘   └─────────┘
    ▲               ▲
    │               │
┌─────────┐   ┌─────────┐
│ gg-gen  │   │ reo-gen │
│ +sched  │   │ +sched  │
└─────────┘   └─────────┘
```

Each dashboard has:
- **Generator container** (one-shot): Produces static HTML on startup
- **Scheduler container** (long-running): Regenerates HTML every 5 minutes

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Environment files configured for each dashboard:
  - `../grumpygoose/.env`
  - `../rewards-eligibility-oracle-dashboard/.env`

### Deploy All Dashboards

```bash
./deploy.sh
```

### Deploy Individual Dashboards

```bash
# Skip REO (deploy only Grumpy Goose)
./deploy.sh --skip-reo

# Skip Grumpy Goose (deploy only REO)
./deploy.sh --skip-goose
```

### Manual Deployment with Docker Compose

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f grumpygoose-scheduler
docker compose logs -f reo-scheduler
docker compose logs -f nginx

# Stop all services
docker compose down
```

## Access

Once deployed, access dashboards at:

- **Hub**: http://localhost/ or http://dashboards.thegraph.foundation/
- **Grumpy Goose**: http://localhost/goose
- **REO**: http://localhost/reo

## Development

### File Structure

```
.
├── docker-compose.yml           # Main orchestration
├── deploy.sh                    # Deployment script
├── infrastructure/
│   ├── nginx/
│   │   ├── nginx.conf          # Nginx routing configuration
│   │   └── hub/
│   │       └── index.html      # Dashboard hub page
│   └── tests/
│       └── e2e/                # Playwright end-to-end tests
└── README.md
```

### Updating the Hub Page

Edit `infrastructure/nginx/hub/index.html` and restart Nginx:

```bash
docker compose restart nginx
```

### Modifying Nginx Routes

Edit `infrastructure/nginx/nginx.conf` and restart Nginx:

```bash
docker compose restart nginx
```

## Testing

### Run Playwright E2E Tests

```bash
cd infrastructure/tests/e2e
npm install
npm test
```

Tests verify:
- Hub page loads correctly
- Links to dashboards work
- Each dashboard renders properly
- Navigation and UI elements function

## Troubleshooting

### Check Container Status

```bash
docker compose ps
```

### View Logs

```bash
# All logs
docker compose logs -f

# Specific service
docker compose logs -f nginx
docker compose logs -f grumpygoose-scheduler
docker compose logs -f reo-scheduler
```

### Restart Individual Services

```bash
# Restart Nginx
docker compose restart nginx

# Restart a scheduler
docker compose restart grumpygoose-scheduler
docker compose restart reo-scheduler

# Regenerate a dashboard immediately
docker compose restart grumpygoose
docker compose restart reo
```

### Check Volumes

```bash
# List volumes
docker volume ls | grep dashboards

# Inspect volume
docker volume inspect goose-output
docker volume inspect reo-output
```

## Production Deployment

For production deployment at dashboards.thegraph.foundation:

1. Ensure DNS points to the server
2. Configure firewall to allow port 80
3. Set up SSL/TLS (use Let's Encrypt with certbot)
4. Deploy using `./deploy.sh`

### Adding HTTPS (Recommended)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d dashboards.thegraph.foundation

# Auto-renewal is configured by default
```

## App Repositories

This infrastructure orchestrates two separate application repositories:

- **Grumpy Goose**: https://github.com/graphprotocol/grumpygoose
- **Rewards Eligibility Oracle**: https://github.com/graphprotocol/rewards-eligibility-oracle-dashboard

Each app has its own:
- Dockerfile
- GitHub Actions workflow
- Deployment workflow
- Development cycle

## Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Review individual app repositories
- Contact the team

## License

See individual app repositories for license information.
