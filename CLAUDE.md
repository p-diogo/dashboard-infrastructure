# The Graph Dashboards Infrastructure - AI Developer Guide

Complete guide for Claude Code and other AI agents working on this project.

## Project Overview

This repository provides unified deployment infrastructure for The Graph Protocol's monitoring dashboards using Docker Compose and Caddy.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Caddy (ports 80/443)                    │
│  Routes: / → hub, /goose (prod+staging), /reo (protected) │
│  Serves static HTML, reverse proxy to staging, SSL/TLS     │
└─────────────────────────────────────────────────────────────┘
           │                    │                  │
    ┌──────┴────────┐    ┌─────┴─────┐     ┌─────┴─────┐
    │                 │    │           │     │           │
    ▼                 ▼    ▼           ▼     ▼           ▼
┌─────────┐     ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Volume  │     │ Volume  │  │ Volume  │  │Auth Gate│
│ /hub    │     │/goose   │  │ /reo    │  │ :8000   │
│         │     │ (prod)  │  │         │  │         │
│         │     │Volume   │  │         │  │         │
│         │     │(staging)│  │         │  │         │
└─────────┘     └─────────┘  └─────────┘  └─────────┘
                (goose-prod-*)
                (goose-staging-*)
```

### Services

| Service | Purpose | Technology |
|---------|---------|------------|
| **caddy** | Web server & reverse proxy, automatic HTTPS | Caddy |
| **auth-gate** | OTP authentication for REO | FastAPI/Python 3.11 |
| **grumpygoose** | Production one-shot dashboard generator | Python |
| **grumpygoose-scheduler** | Production scheduler, regenerates dashboard every 5min | Python |
| **grumpygoose-staging** | Staging server (Python) | Python |
| **grumpygoose-scheduler-staging** | Staging scheduler | Python |
| **reo** | One-shot REO dashboard generator | Python |
| **reo-scheduler** | Regenerates REO dashboard every 5min | Python |

### Environments

| Environment | URL | Services | Volumes |
|-------------|-----|----------|---------|
| **Production** | hub.thegraph.foundation/goose | grumpygoose-prod, grumpygoose-scheduler-prod | goose-prod-* |
| **Staging** | staging.hub.thegraph.foundation | grumpygoose-staging, grumpygoose-scheduler-staging | goose-staging-* |

### Protected Routes

- `/` (hub) - **Public**
- `/goose` (Grumpy Goose Production) - **Public**
- `/staging` → reverse proxy to `grumpygoose-staging:8080` - **Public**
- `/reo` (Rewards Eligibility Oracle) - **OTP Protected**

## Repository Structure

```
dashboard-infrastructure/
├── docker-compose.yml              # Main orchestration (prod + staging)
├── deploy.sh                       # Deployment script
├── .env                            # Environment variables (not in git)
├── config/
│   └── allowed_emails.txt          # Email whitelist for REO auth
├── infrastructure/
│   ├── caddy/
│   │   └── Caddyfile              # Caddy routing configuration
│   ├── nginx/
│   │   ├── hub/
│   │   │   └── index.html          # Dashboard hub landing page
│   │   └── reo-login/
│   │       └── index.html          # OTP login page for REO
│   ├── auth/                       # OTP authentication service
│   │   ├── main.py                 # FastAPI application
│   │   ├── auth.py                 # Session management
│   │   ├── email.py                # Email sending logic
│   │   ├── whitelist.py            # Email whitelist validation
│   │   ├── models.py               # Pydantic models
│   │   ├── requirements.txt        # Python dependencies
│   │   ├── Dockerfile              # Auth service image
│   │   └── templates/
│   │       ├── email.html          # OTP email template
│   │       ├── grt_logo.svg        # The Graph logo
│   │       └── README.md           # Logo instructions
│   └── tests/
│       └── e2e/                    # Playwright end-to-end tests
├── docs/                           # Human-readable documentation
│   ├── DEPLOYMENT.md               # Production deployment guide
│   ├── VOLUME_MIGRATION.md         # Volume migration guide
│   └── AUTHENTICATION.md           # OTP authentication setup
├── CLAUDE.md                       # This file (AI developer guide)
└── README.md                       # Human-friendly overview
```

### Volume Naming

All Grumpy Goose volumes follow the pattern: `goose-{environment}-*`

| Environment | Output Volume | Data Volume |
|-------------|---------------|-------------|
| Production | goose-prod-output | goose-prod-data |
| Staging | goose-staging-output | goose-staging-data |

## OTP Authentication System

### How It Works

The REO dashboard uses nginx `auth_request` module with a FastAPI backend:

```
1. User requests /reo
2. Nginx checks for reo_session cookie
3. If missing/invalid → 302 redirect to /reo/login
4. User enters email → POST /reo/api/request-otp
5. Auth-gate sends 6-digit code via email
6. User enters code → POST /reo/api/verify-otp
7. Auth-gate validates and sets session cookie (7-day expiry)
8. User redirected to /reo
9. Nginx validates each request via /auth-proxy → auth-gate/validate
```

### Auth Service Files

**Entry point:** `infrastructure/auth/main.py`

**Key modules:**
- `auth.py` - In-memory session management (OTP codes, rate limits, sessions)
- `email.py` - SMTP email sending with template rendering
- `whitelist.py` - Email whitelist with wildcard domain support
- `models.py` - Pydantic request/response models

**API endpoints:**
- `GET /health` - Health check for Docker
- `GET /validate` - Internal auth validation for nginx auth_request
- `POST /reo/api/request-otp` - Request OTP code via email
- `POST /reo/api/verify-otp` - Verify OTP and create session
- `POST /reo/api/logout` - Invalidate session
- `GET /docs` - Auto-generated FastAPI docs

### Security Features

- **Session cookies**: HttpOnly, SameSite=lax, 7-day expiry
- **OTP storage**: SHA256 hashed
- **Rate limiting**: 5 OTP requests per hour per email
- **OTP expiry**: 10 minutes
- **Email whitelist**: Supports wildcards (`*@domain.com`)
- **Non-root container**: Runs as `auth:auth` (UID 1000)

### Configuration

Environment variables:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - SMTP settings
- `SMTP_FROM` - From address for emails
- `SESSION_SECRET` - HMAC signing secret for sessions
- `OTP_EXPIRY_MINUTES` - OTP validity period (default: 10)
- `SESSION_EXPIRY_DAYS` - Session cookie expiry (default: 7)
- `RATE_LIMIT_PER_HOUR` - OTP request rate limit (default: 5)

Email whitelist format:
```
# Exact email
user@thegraph.foundation

# Wildcard domain
*@thegraph.foundation

# Comment
# This is a comment
```

## Development Workflow

### For AI Agents

**1. Understanding the codebase:**
- Read this CLAUDE.md first
- Check docs/ for human-oriented documentation
- Use `find` and `grep` to explore code

**2. Making changes:**
- Feature work: Use git worktrees
- Always update relevant documentation
- Test changes locally before committing

**3. File structure conventions:**
- Infrastructure code: `infrastructure/<service>/`
- Configuration: `config/` or root level
- Documentation: `docs/` (for humans)
- AI docs: `CLAUDE.md` (this file)

### Git Workflow

**Use worktrees for feature branches:**
```bash
# Create worktree
git worktree add ../dashboard-infrastructure-otp feature/otp-auth

# Work in worktree
cd ../dashboard-infrastructure-otp

# When done, merge and cleanup
git checkout main
git merge feature/otp-auth
git worktree remove ../dashboard-infrastructure-otp
```

### Testing

**E2E tests (Playwright):**
```bash
cd infrastructure/tests/e2e
npm install
npm test
```

**Manual testing:**
```bash
# Start services
docker compose up -d

# Check health
curl http://localhost/health

# Test auth flow
# 1. Visit http://localhost/reo
# 2. Should redirect to /reo/login
# 3. Enter email
# 4. Check email for code
# 5. Enter code
# 6. Should redirect to /reo
```

## Common Tasks

### Adding a New Dashboard Route

1. Update `infrastructure/nginx/nginx.conf`:
   ```nginx
   location /new-dashboard {
       alias /usr/share/nginx/html/new-dashboard;
       try_files $uri $uri/ /new-dashboard/index.html;
   }
   ```

2. Add volume mount in `docker-compose.yml`:
   ```yaml
   volumes:
     - new-dashboard-output:/usr/share/nginx/html/new-dashboard:ro
   ```

3. Add service in `docker-compose.yml` for the new dashboard

### Modifying Nginx Configuration

Edit `infrastructure/nginx/nginx.conf` and restart:
```bash
docker compose restart nginx
```

### Updating Auth Service

1. Modify Python files in `infrastructure/auth/`
2. Rebuild and restart:
   ```bash
   docker compose up -d --build auth-gate
   ```

### Adding Emails to Whitelist

Edit `config/allowed_emails.txt`:
```
# Add one per line
user@thegraph.foundation
*@partner-domain.com
```

No restart needed - whitelist is reloaded on each request.

### Viewing Auth Service Stats

```bash
curl http://localhost:8000/stats
```

Returns:
```json
{
  "active_otps": 2,
  "active_sessions": 5,
  "rate_limit_entries": 3,
  "whitelist_entries": 10
}
```

## Important Constraints

### DO NOT:

- Commit `.env` files (contains secrets)
- Commit `SESSION_SECRET` or SMTP credentials
- Change `SESSION_SECRET` in production (invalidates all sessions)
- Remove `__pycache__` directories from `.gitignore` without reason
- Modify volume names without data migration plan
- Deploy to production without testing staging first
- Mix up staging and production volume names

### DO:

- Always test auth flow after changes
- Use environment variables for configuration
- Keep authentication logic in auth service
- Document breaking changes
- Update CLAUDE.md when making architectural changes
- Follow the Grumpy Goose deployment workflow below

## Grumpy Goose Deployment Workflow

### Development Cycle

1. **Develop** in the `grumpygoose` repository
2. **Test** locally
3. **Commit** and push to trigger GitHub Actions
4. **Deploy to staging** and verify
5. **Deploy to production** after staging verification

### Deploy to Staging

```bash
cd dashboard-infrastructure/

# Pull latest image
docker pull ghcr.io/graphprotocol/grumpygoose:latest

# Deploy to staging
docker compose up -d grumpygoose-staging grumpygoose-scheduler-staging

# Verify staging
# Visit: https://staging.hub.thegraph.foundation
# Check logs: docker logs -f grumpygoose-scheduler-staging
```

### Deploy to Production

```bash
cd dashboard-infrastructure/

# Pull latest image
docker pull ghcr.io/graphprotocol/grumpygoose:latest

# Deploy to production
docker compose up -d grumpygoose grumpygoose-scheduler

# Verify production
# Visit: https://hub.thegraph.foundation/goose
# Check logs: docker logs -f grumpygoose-scheduler-prod
```

### Volume Management

**Important**: Grumpy Goose uses separate volumes for staging and production to prevent conflicts:

| Environment | Output Volume | Data Volume |
|-------------|---------------|-------------|
| Production | goose-prod-output | goose-prod-data |
| Staging | goose-staging-output | goose-staging-data |

If you need to reset an environment:

```bash
# Stop services
docker compose stop grumpygoose-staging grumpygoose-scheduler-staging

# Remove volumes (WARNING: Deletes all data!)
docker volume rm goose-staging-output goose-staging-data

# Restart services (will create fresh volumes)
docker compose up -d grumpygoose-staging grumpygoose-scheduler-staging
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment instructions.

See [docs/VOLUME_MIGRATION.md](docs/VOLUME_MIGRATION.md) for volume migration procedures.

Quick test deployment:
```bash
./deploy.sh
```

Production deployment with SSL:
```bash
# 1. Set up SSL certificates
sudo certbot certonly --webroot -w /var/www/certbot \
  -d dashboards.thegraph.foundation

# 2. Use SSL compose file
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

## Troubleshooting

### Auth service not sending emails

```bash
# Check logs
docker compose logs auth-gate

# Verify SMTP env vars
docker compose exec auth-gate env | grep SMTP

# Check whitelist exists
docker compose exec auth-gate cat /app/config/allowed_emails.txt
```

### Nginx 502 errors

```bash
# Check upstream is running
docker compose ps

# Verify auth-gate is reachable
docker compose exec nginx wget -O- http://auth-gate:8000/health

# Check nginx config
docker compose exec nginx nginx -t
```

### Sessions not persisting

- Verify `SESSION_SECRET` is set
- Check cookie is being set (browser DevTools)
- Ensure nginx `auth_request` includes `Cookie` header

## Related Repositories

- **Grumpy Goose**: https://github.com/graphprotocol/grumpygoose
- **Rewards Eligibility Oracle**: https://github.com/graphprotocol/rewards-eligibility-oracle-dashboard

Each app repository has its own:
- Dockerfile
- CI/CD pipeline
- Deployment workflow
- Development cycle

This infrastructure repo orchestrates those apps.

## TODO.md Maintenance

**CRITICAL:** All agents MUST maintain TODO.md when working on this project.

See top of this file for TODO.md maintenance rules.

---

**For AI assistance:** This CLAUDE.md should be your primary reference.
**For humans:** Check README.md and docs/ folder.
