# Deployment Guide

Complete guide for deploying The Graph Dashboards Infrastructure.

## Table of Contents

- [Grumpy Goose Environments](#grumpy-goose-environments)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [SSL/TLS Setup](#ssltls-setup)
- [Verification](#verification)
- [Maintenance](#maintenance)

---

## Grumpy Goose Environments

This infrastructure manages **TWO Grumpy Goose environments**:

### Production

- **URL**: `hub.thegraph.foundation/goose`
- **Volumes**: `goose-prod-output`, `goose-prod-data`
- **Services**: `grumpygoose-prod`, `grumpygoose-scheduler-prod`
- **Purpose**: Official production deployment

### Staging

- **URL**: ` staging.hub.thegraph.foundation`
- **Volumes**: `goose-staging-output`, `goose-staging-data`
- **Services**: `grumpygoose-staging`, `grumpygoose-scheduler-staging`
- **Purpose**: Test new features before production

### Quick Reference

| Environment | URL | Services Command | Volumes |
|-------------|-----|------------------|---------|
| **Production** | hub.thegraph.foundation/goose | `docker compose up -d grumpygoose grumpygoose-scheduler` | goose-prod-* |
| **Staging** | staging.hub.thegraph.foundation | `docker compose up -d grumpygoose-staging grumpygoose-scheduler-staging` | goose-staging-* |

### Deployment Workflow

1. **Develop** changes in the `grumpygoose` repository
2. **Test** locally
3. **Commit** and push to trigger GitHub Actions build
4. **Deploy to staging** first and verify
5. **Deploy to production** after staging verification

```bash
# Deploy to staging
cd dashboard-infrastructure/
docker pull ghcr.io/graphprotocol/grumpygoose:latest
docker compose up -d grumpygoose-staging grumpygoose-scheduler-staging

# Test staging at https://staging.hub.thegraph.foundation

# Deploy to production (after staging verification)
docker compose up -d grumpygoose grumpygoose-scheduler
```

---

## Quick Start

```bash
# Clone the repository
git clone git@github.com:p-diogo/dashboard-infrastructure.git
cd dashboard-infrastructure

# Run deployment script
./deploy.sh

# Verify deployment
docker compose ps
```

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+ recommended)
- **RAM**: 2GB minimum
- **Disk**: 10GB free space
- **Ports**: 80 (HTTP), 443 (HTTPS)

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+

**Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Install Docker Compose:**
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### Required Repositories

Clone sibling repositories:

```bash
# Grumpy Goose
cd /path/to/repos
git clone git@github.com:graphprotocol/grumpygoose.git

# Rewards Eligibility Oracle
git clone git@github.com:graphprotocol/rewards-eligibility-oracle-dashboard.git
```

## Initial Setup

### 1. Environment Files

Configure each dashboard's environment file:

**Grumpy Goose** (`../grumpygoose/.env`):
```bash
ENVIRONMENT=production
GOOSE_OUTPUT_DIR=/app/output
```

**REO Dashboard** (`../rewards-eligibility-oracle-dashboard/.env`):
```bash
ENVIRONMENT=production
# Add any required API keys
```

### 2. Email Authentication (REO Dashboard)

See [AUTHENTICATION.md](AUTHENTICATION.md) for complete setup.

Create `.env` in project root:
```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@thegraph.foundation
SMTP_PASSWORD=<app-password>
SMTP_FROM="The Graph Dashboards <info@thegraph.org>"

# Security
SESSION_SECRET=$(openssl rand -hex 32)
```

Configure email whitelist:
```bash
cp config/allowed_emails.txt.example config/allowed_emails.txt
# Edit and add authorized emails
```

### 3. DNS Configuration

Point your domain to the server:

```
dashboards.thegraph.foundation → A <server-ip>
```

Verify DNS propagation:
```bash
dig dashboards.thegraph.foundation
```

## Configuration

### Docker Compose Override

For production, create `docker-compose.prod.yml`:

```yaml
services:
  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx-ssl.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
```

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  nginx:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  auth-gate:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## Deployment

### Automated Deployment

```bash
./deploy.sh
```

This will:
1. Build all Docker images
2. Start all services
3. Verify health checks
4. Display service URLs

### Manual Deployment

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### Selective Deployment

Deploy only specific dashboards:

```bash
# Only Grumpy Goose
./deploy.sh --skip-reo

# Only REO
./deploy.sh --skip-goose
```

## SSL/TLS Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d dashboards.thegraph.foundation \
  --email admin@thegraph.foundation \
  --agree-tos

# Certificates saved to:
# /etc/letsencrypt/live/dashboards.thegraph.foundation/
```

Mount certificates in Docker Compose:
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

### Option 2: Custom Certificates

```bash
# Copy certificates
mkdir -p ssl
cp your-cert.crt ssl/
cp your-cert.key ssl/

# Mount in docker-compose.yml
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

### Verify SSL

```bash
curl -I https://dashboards.thegraph.foundation
```

## Verification

### Health Checks

```bash
# Check all services
docker compose ps

# Check nginx
curl http://localhost/health

# Check auth-gate
curl http://localhost:8000/health
```

### Dashboard Access

- **Hub**: http://localhost/
- **Grumpy Goose**: http://localhost/goose
- **REO Login**: http://localhost/reo/login

### Smoke Tests

```bash
cd infrastructure/tests/e2e
npm install
npm test
```

## Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f nginx
docker compose logs -f auth-gate
docker compose logs -f grumpygoose-scheduler
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific
docker compose restart nginx
docker compose restart auth-gate
```

### Update Dashboards

```bash
# Pull latest images
docker compose pull

# Rebuild and restart
docker compose up -d --build
```

### Backup

```bash
# Backup volumes
docker run --rm \
  -v goose-output:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/goose-$(date +%Y%m%d).tar.gz /data

docker run --rm \
  -v reo-output:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/reo-$(date +%Y%m%d).tar.gz /data
```

### Monitoring

Set up monitoring for:
- Container health (`docker compose ps`)
- Disk usage (`df -h`)
- Memory usage (`docker stats`)
- Log files (`journalctl -u docker`)

### Log Rotation

Add to `/etc/logrotate.d/docker-compose`:

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    missingok
    delaycompress
    copytruncate
}
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs <service>

# Check resource usage
docker stats

# Verify ports not in use
sudo netstat -tulpn | grep :80
```

### 502 Bad Gateway

```bash
# Check upstream services
docker compose ps

# Verify nginx config
docker compose exec nginx nginx -t

# Check auth-gate is reachable
docker compose exec nginx wget -O- http://auth-gate:8000/health
```

### Authentication not working

See [AUTHENTICATION.md](AUTHENTICATION.md#troubleshooting).

### High memory usage

```bash
# Check container stats
docker stats

# Restart heavy containers
docker compose restart

# Add resource limits in docker-compose.yml
```

## Security Checklist

- [ ] Firewall configured (only ports 80, 443 open)
- [ ] SSL/TLS enabled
- [ ] Strong `SESSION_SECRET` set
- [ ] SMTP credentials secure (not in git)
- [ ] Email whitelist configured
- [ ] Docker images updated regularly
- [ ] Log rotation configured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Incident response plan documented

## Support

For issues:
1. Check logs: `docker compose logs -f`
2. Review troubleshooting section
3. Check individual app repositories
4. Contact the team
