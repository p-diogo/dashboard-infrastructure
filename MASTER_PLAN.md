# 🚀 The Graph Dashboards - Master Plan & Project State

**Created:** 2025-01-18
**Status:** Ready for Deployment
**Last Updated:** Complete implementation with documentation

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Repository Structure](#repository-structure)
4. [What Was Built](#what-was-built)
5. [Deployment Plan](#deployment-plan)
6. [SSL Configuration Options](#ssl-configuration-options)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps](#next-steps)
10. [Important Notes](#important-notes)

---

## 🎯 PROJECT OVERVIEW

### **Goal**
Unify deployment infrastructure for The Graph Protocol dashboards with consistent workflows, automated testing, and easy deployment.

### **Dashboards**
- **Grumpy Goose** 🪿 - Governance oversight and operational monitoring
- **Rewards Eligibility Oracle (REO)** 🍪 - Indexer eligibility monitoring (GIP-0079)

### **What Changed**
- REO now matches Grumpy Goose's workflow (Docker, scheduler, deploy.sh, CI/CD)
- Unified Nginx serves both apps from one location
- Beautiful dashboard hub page linking to all dashboards
- Comprehensive e2e testing (52 tests with Playwright)
- Multiple SSL options to choose from

### **What Stayed the Same**
- Both apps remain in separate GitHub repos (no monorepo)
- Grumpy Goose continues working as before
- REO core logic unchanged (no breaking changes)

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                   Nginx (port 80/443)                       │
│     Serves: / → hub, /goose, /reo with TLS termination    │
└─────────────────────────────────────────────────────────────┘
                  │                    │
           ┌──────┴────────┐          │
           │               │          │
           ▼               ▼          ▼
    ┌────────────┐   ┌────────────┐
    │  Volume     │   │  Volume     │
    │  /goose     │   │  /reo       │
    └────────────┘   └────────────┘
           │               │
    ┌──────┴────────┐     │
    ▼               ▼     ▼
┌─────────┐   ┌─────────┐
│gg-gen   │   │reo-gen  │
│gg-sched │   │reo-sched│
└─────────┘   └─────────┘
```

### **DNS & SSL Strategy**

```
Phase 1 (NOW): Testing
├─ hub.thegraph.foundation → NEW infrastructure (test environment)
└─ dashboards.thegraph.foundation → OLD infrastructure (still live)

Phase 2 (LATER): Cutover
├─ hub.thegraph.foundation → Staging environment
└─ dashboards.thegraph.foundation → NEW infrastructure (production)

Phase 3 (FUTURE): Staging + Prod
├─ hub.thegraph.foundation → Staging/testing
└─ dashboards.thegraph.foundation → Production
```

### **Cloudflare Setup**
- **DNS Only Mode** (grey cloud)
- Cloudflare provides DNS resolution
- Your nginx handles TLS termination
- Let's Encrypt with certbot for certificates
- Automatic certificate renewals

---

## 📁 REPOSITORY STRUCTURE

### **Three Separate GitHub Repos**

```
https://github.com/graphprotocol/
├── grumpygoose ✅ (existing, working)
│   └─ Governance monitoring app
│   └─ Has: Dockerfile, CI/CD, deploy.sh, scheduler
│
└── rewards-eligibility-oracle-dashboard ✅ (enhanced)
    └─ Indexer eligibility monitoring app
    └─ NOW HAS: Dockerfile, CI/CD, deploy.sh, scheduler, tests

https://github.com/p-diogo/
└── dashboard-infrastructure ✅ (NEW - orchestrates both)
    └─ Deployment orchestration
    └─ Contains: docker-compose, nginx, hub, tests, SSL configs
```

### **Local File Structure**

```
/home/pdiogo/hosted-apps/repos/
├── grumpygoose/                          # Existing app
│   ├── src/
│   ├── Dockerfile
│   ├── .github/workflows/docker.yml
│   ├── deploy.sh
│   └── ...
│
├── rewards-eligibility-oracle-dashboard/  # Enhanced app
│   ├── generate_dashboard.py             # Main script (unchanged)
│   ├── telegram_bot.py                   # (unchanged)
│   ├── Dockerfile                        # NEW ⭐
│   ├── scheduler.py                      # NEW ⭐
│   ├── deploy.sh                         # NEW ⭐
│   ├── requirements.txt                  # UPDATED (added schedule)
│   ├── requirements-dev.txt              # NEW (pytest, responses, freezegun)
│   ├── .dockerignore                     # NEW
│   ├── .github/workflows/docker.yml      # NEW ⭐
│   ├── tests/                            # NEW ⭐
│   │   ├── unit/
│   │   │   └── test_subgraph_fetch.py
│   │   ├── integration/
│   │   └── fixtures/
│   └── CLAUDE.md                         # NEW (AI assistant guide)
│
└── dashboard-infrastructure/              # NEW repo
    ├── docker-compose.yml                # Base orchestration
    ├── docker-compose.test.yml           # Test on port 8080
    ├── docker-compose.ssl.yml            # Cloudflare SSL option
    ├── docker-compose.letsencrypt.yml    # Let's Encrypt SSL option ⭐
    ├── deploy.sh                         # Deploy script
    ├── README.md                         # Infrastructure docs
    ├── IMPLEMENTATION_SUMMARY.md         # Detailed summary
    ├── DEPLOYMENT_GUIDE.md               # Deployment guide
    ├── SSL_SETUP.md                      # Cloudflare SSL guide
    ├── LETSENCRYPT_SETUP.md              # Let's Encrypt guide ⭐
    ├── MASTER_PLAN.md                    # THIS FILE ⭐
    └── infrastructure/
        ├── nginx/
        │   ├── nginx.conf                # HTTP only
        │   ├── nginx-ssl.conf            # Cloudflare SSL
        │   ├── nginx-letsencrypt.conf    # Let's Encrypt ⭐
        │   └── hub/
        │       └── index.html            # Dashboard hub page
        └── tests/e2e/                    # Playwright tests (52 tests)
            ├── package.json
            ├── playwright.config.ts
            └── tests/
                ├── hub.spec.ts           # 13 tests
                ├── grumpygoose.spec.ts   # 12 tests
                ├── reo.spec.ts           # 15 tests
                └── navigation.spec.ts    # 12 tests
```

---

## ✅ WHAT WAS BUILT

### **REO Enhancements (9 new files, 1 updated)**

| File | Purpose | Status |
|------|---------|--------|
| `Dockerfile` | Container image | ✅ Created |
| `scheduler.py` | 5-minute updates | ✅ Created |
| `deploy.sh` | Build & deploy script | ✅ Created |
| `.github/workflows/docker.yml` | CI/CD pipeline | ✅ Created & pushed |
| `requirements-dev.txt` | Test dependencies | ✅ Created |
| `.dockerignore` | Build optimization | ✅ Created |
| `tests/unit/test_subgraph_fetch.py` | Unit tests | ✅ Created |
| `CLAUDE.md` | AI assistant guide | ✅ Created |
| `requirements.txt` | Added `schedule>=1.2.0` | ✅ Updated |
| **Total** | | **9 new files** |

### **Infrastructure (17 new files)**

| File | Purpose | Status |
|------|---------|--------|
| `docker-compose.yml` | Production orchestration | ✅ Created |
| `docker-compose.test.yml` | Test environment (port 8080) | ✅ Created |
| `docker-compose.ssl.yml` | Cloudflare SSL option | ✅ Created |
| `docker-compose.letsencrypt.yml` | Let's Encrypt option | ✅ Created |
| `deploy.sh` | Deploy script | ✅ Created |
| `README.md` | Documentation | ✅ Created |
| `IMPLEMENTATION_SUMMARY.md` | Detailed summary | ✅ Created |
| `DEPLOYMENT_GUIDE.md` | Deployment guide | ✅ Created |
| `SSL_SETUP.md` | Cloudflare SSL guide | ✅ Created |
| `LETSENCRYPT_SETUP.md` | Let's Encrypt guide | ✅ Created |
| `MASTER_PLAN.md` | This file | ✅ Created |
| `infrastructure/nginx/nginx.conf` | HTTP config | ✅ Created |
| `infrastructure/nginx/nginx-ssl.conf` | Cloudflare SSL config | ✅ Created |
| `infrastructure/nginx/nginx-letsencrypt.conf` | Let's Encrypt config | ✅ Created |
| `infrastructure/nginx/hub/index.html` | Dashboard hub | ✅ Created |
| `infrastructure/tests/e2e/*` | Playwright tests (52 total) | ✅ Created |
| **Total** | | **17 new files** |

### **E2E Tests (52 tests total)**

| Test Suite | Tests | Purpose |
|------------|-------|---------|
| `hub.spec.ts` | 13 | Hub page functionality |
| `grumpygoose.spec.ts` | 12 | Grumpy Goose dashboard |
| `reo.spec.ts` | 15 | REO dashboard |
| `navigation.spec.ts` | 12 | Cross-dashboard navigation |

---

## 🚀 DEPLOYMENT PLAN

### **Phase 1: Current State (Completed)**

✅ REO enhancements pushed to GitHub
✅ GitHub Actions built REO Docker image
✅ Infrastructure repo created on GitHub
✅ All documentation committed

**Docker Image Available:**
```
ghcr.io/graphprotocol/rewards-eligibility-oracle-dashboard:latest ✅
```

### **Phase 2: DNS Setup (TODO)**

1. Create DNS record for `hub.thegraph.foundation` → your server IP
2. In Cloudflare, set to **DNS-only** (grey cloud icon)
3. Keep `dashboards.thegraph.foundation` pointing to old infrastructure (for now)

### **Phase 3: Deploy to hub.thegraph.foundation (TODO)**

#### **3a. Choose SSL Option**

**Option A: Let's Encrypt (Recommended) ⭐**
- Auto-renews every 90 days
- Full control
- Works with direct domain access

**Option B: Cloudflare Origin CA**
- 15-year validity
- No renewals needed
- Requires Cloudflare proxy

#### **3b. Create REO .env File**

```bash
cd /home/pdiogo/hosted-apps/repos/rewards-eligibility-oracle-dashboard
cp env.example .env
# Edit .env with your API keys and configuration
```

#### **3c. Deploy**

**If using Let's Encrypt:**
```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# 1. Deploy with HTTP first
docker compose -f docker-compose.letsencrypt.yml up -d

# 2. Generate SSL certificate
docker compose -f docker-compose.letsencrypt.yml run --rm certbot \
  certonly --webroot \
  -w /var/www/certbot \
  -d hub.thegraph.foundation \
  --email your-email@example.com \
  --agree-tos

# 3. Restart nginx to enable HTTPS
docker compose -f docker-compose.letsencrypt.yml restart nginx

# 4. Set up auto-renewal cron
crontab -e
# Add: 0 3 * * * cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure && docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew --quiet && docker compose -f docker-compose.letsencrypt.yml restart nginx > /var/log/certbot-renew.log 2>&1
```

**If using HTTP only (testing):**
```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure
docker compose up -d
```

### **Phase 4: Verification (TODO)**

```bash
# Test hub page
curl http://hub.thegraph.foundation
curl https://hub.thegraph.foundation

# Test dashboards
curl http://hub.thegraph.foundation/goose
curl http://hub.thegraph.foundation/reo

# Check container status
docker compose ps

# View logs
docker compose logs -f
```

### **Phase 5: Cutover to Production (TODO)**

Once `hub.thegraph.foundation` is verified working:

1. Update DNS: `dashboards.thegraph.foundation` → your server IP
2. Add to nginx config (already supports both domains!)
3. Verify: https://dashboards.thegraph.foundation works

### **Phase 6: Make hub the Staging Environment (Future)**

- Keep `hub.thegraph.foundation` for testing new features
- Deploy to hub first, verify, then deploy to dashboards
- Staging → Production workflow

---

## 🔐 SSL CONFIGURATION OPTIONS

### **Option 1: Let's Encrypt (Recommended) ⭐**

**Pros:**
- ✅ TLS termination on your server (full control)
- ✅ Works with Cloudflare DNS-only mode
- ✅ Auto-renews every 30 days before expiry
- ✅ Real client IPs in logs
- ✅ Direct domain access works perfectly
- ✅ Free

**Cons:**
- Requires initial certbot setup
- Needs cron job for renewals

**Files:**
- `LETSENCRYPT_SETUP.md` - Complete guide
- `docker-compose.letsencrypt.yml`
- `infrastructure/nginx/nginx-letsencrypt.conf`

**Commands:**
```bash
# Initial deployment
docker compose -f docker-compose.letsencrypt.yml up -d

# Generate certificates
docker compose -f docker-compose.letsencrypt.yml run --rm certbot certonly --webroot -w /var/www/certbot -d hub.thegraph.foundation --email your-email@example.com --agree-tos

# Restart nginx
docker compose -f docker-compose.letsencrypt.yml restart nginx

# Manual renewal
docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew
docker compose -f docker-compose.letsencrypt.yml restart nginx

# Auto-renewal (add to crontab)
0 3 * * * cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure && docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew --quiet && docker compose -f docker-compose.letsencrypt.yml restart nginx > /var/log/certbot-renew.log 2>&1
```

### **Option 2: Cloudflare Origin CA**

**Pros:**
- ✅ No cert renewals (15-year validity)
- ✅ Cloudflare manages everything
- ✅ Simple setup

**Cons:**
- ❌ Requires Cloudflare proxy (orange cloud)
- ❌ Had issues in the past with direct domain access
- ❌ Less control

**Files:**
- `SSL_SETUP.md` - Complete guide
- `docker-compose.ssl.yml`
- `infrastructure/nginx/nginx-ssl.conf`

**Commands:**
```bash
# 1. Generate Origin CA in Cloudflare Dashboard
# 2. Save certificates to infrastructure/nginx/
# 3. Change Cloudflare to Full (strict) mode
# 4. Deploy
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

### **Option 3: HTTP Only (Testing)**

**Use for initial testing without SSL**

**Files:**
- `docker-compose.yml` (base configuration)
- `infrastructure/nginx/nginx.conf`

**Commands:**
```bash
docker compose up -d
```

---

## 💻 COMMON COMMANDS

### **Infrastructure Management**

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Start all services (HTTP only)
docker compose up -d

# Start with Let's Encrypt SSL
docker compose -f docker-compose.yml -f docker-compose.letsencrypt.yml up -d

# Start with Cloudflare SSL
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d

# Start test environment (port 8080)
docker compose -f docker-compose.test.yml up -d

# View logs
docker compose logs -f
docker compose logs -f nginx
docker compose logs -f grumpygoose-scheduler
docker compose logs -f reo-scheduler

# View container status
docker compose ps

# Stop all services
docker compose down

# Restart specific service
docker compose restart nginx

# Update and redeploy
git pull origin main
docker compose up -d --force-recreate
```

### **REO Management**

```bash
cd /home/pdiogo/hosted-apps/repos/rewards-eligibility-oracle-dashboard

# Build Docker image locally
./deploy.sh

# Build and push to GHCR
./deploy.sh push

# Build with specific version
VERSION=1.0.0 ./deploy.sh push

# Test locally with Docker
docker run --rm -v $(pwd)/output:/app/output ghcr.io/graphprotocol/rewards-eligibility-oracle-dashboard:latest
```

### **SSL Certificate Management**

```bash
# Generate new certificate (Let's Encrypt)
docker compose -f docker-compose.letsencrypt.yml run --rm certbot certonly --webroot -w /var/www/certbot -d hub.thegraph.foundation --email your-email@example.com --agree-tos

# Renew certificates
docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew

# Test renewal (dry run)
docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew --dry-run

# View certificates
docker compose -f docker-compose.letsencrypt.yml run --rm certbot certificates

# Restart nginx after renewal
docker compose -f docker-compose.letsencrypt.yml restart nginx
```

### **E2E Testing**

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure/infrastructure/tests/e2e

# Install dependencies (first time only)
npm install

# Install Playwright browsers
npx playwright install chromium

# Run all tests
BASE_URL=http://localhost:8080 npm test

# Run with UI
npm run test:ui

# View test report
npm run report
```

---

## 🐛 TROUBLESHOOTING

### **Issue: Container won't start**

**Symptoms:**
- `docker compose up -d` fails
- Container exits immediately

**Solutions:**
```bash
# Check container logs
docker compose logs nginx
docker compose logs reo
docker compose logs grumpygoose

# Check if ports are already in use
sudo lsof -i :80
sudo lsof -i :443

# Stop old containers if conflicting
docker ps -a
docker stop <container-name>

# Check if volumes exist
docker volume ls | grep dashboards
```

### **Issue: REO fails to generate dashboard**

**Symptoms:**
- REO container exits with error
- No index.html generated

**Solutions:**
```bash
# Check if .env file exists
ls -la ../rewards-eligibility-oracle-dashboard/.env

# Create .env from example
cp ../rewards-eligibility-oracle-dashboard/env.example ../rewards-eligibility-oracle-dashboard/.env

# Edit with your values
nano ../rewards-eligibility-oracle-dashboard/.env

# Check logs for specific errors
docker compose logs reo
```

### **Issue: Can't access dashboards**

**Symptoms:**
- Connection refused
- 404 errors
- Gateway errors

**Solutions:**
```bash
# Check if containers are running
docker compose ps

# Check nginx is listening
docker compose exec nginx netstat -tulpn

# Check nginx config
docker compose exec nginx nginx -t

# Test from inside container
docker compose exec nginx wget -O- http://localhost/

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### **Issue: SSL certificate errors**

**Symptoms:**
- Certificate expired
- "SSL handshake failed"
- "Certificate not trusted"

**Solutions:**
```bash
# Check certificate expiry
docker compose run --rm certbot certificates

# Force renewal
docker compose run --rm certbot renew --force-renewal

# Restart nginx
docker compose restart nginx

# Check if certificate files exist
ls -la /var/lib/docker/volumes/certbot-etc/_data/live/
```

### **Issue: Port 8080 test conflicts**

**Symptoms:**
- Test infrastructure on port 8080 conflicts with production

**Solutions:**
```bash
# Stop test infrastructure
docker compose -f docker-compose.test.yml down

# Use different port (edit docker-compose.test.yml)
# Change "8080:80" to "8081:80"

# Verify production is on port 80
curl http://localhost/
```

### **Issue: GitHub Actions not building**

**Symptoms:**
- Push to GitHub but no workflow runs
- Workflow fails

**Solutions:**
```bash
# Check workflow status
gh run list --repo graphprotocol/rewards-eligibility-oracle-dashboard

# View specific run
gh run view <run-id> --repo graphprotocol/rewards-eligibility-oracle-dashboard

# Check if workflow file exists
cat .github/workflows/docker.yml

# Trigger manual run (if needed)
gh workflow run build.yml --repo graphprotocol/rewards-eligibility-oracle-dashboard
```

### **Issue: Dashboard data not updating**

**Symptoms:**
- Dashboard shows old data
- Scheduler not running

**Solutions:**
```bash
# Check scheduler status
docker compose ps
docker compose logs grumpygoose-scheduler
docker compose logs reo-scheduler

# Restart scheduler
docker compose restart grumpygoose-scheduler
docker compose restart reo-scheduler

# Manual regeneration
docker compose restart grumpygoose
docker compose restart reo
```

---

## 📝 NEXT STEPS

### **Immediate (TODO)**

1. **Create DNS record** for `hub.thegraph.foundation` → server IP
2. **Set Cloudflare to DNS-only** (grey cloud)
3. **Create REO .env file** from env.example
4. **Deploy to hub.thegraph.foundation** for testing
5. **Verify everything works** on hub
6. **Run e2e tests** to verify functionality

### **When Testing is Complete**

1. **Update DNS** for `dashboards.thegraph.foundation` → server IP
2. **Verify production works** on dashboards domain
3. **Keep hub as staging** for future deployments

### **Future Enhancements**

1. **Add more tests** to REO (unit tests, integration tests)
2. **Refactor REO code** to break up the large generate_dashboard.py
3. **Add monitoring/alerting** for scheduler health
4. **Add staging deployment workflow** with separate environment variables
5. **Set up CI/CD for infrastructure repo** (e.g., run e2e tests on push)

---

## 📌 IMPORTANT NOTES

### **About Breaking Changes**

**REO has NO breaking changes:**
- All new files are additions
- `generate_dashboard.py` is unchanged
- Telegram bot, notifier, etc. are unchanged
- Existing behavior preserved

### **About Repository Structure**

**This is NOT a monorepo:**
- Each app remains in its own GitHub repo
- Infrastructure repo orchestrates both via Docker Compose
- Apps are developed independently
- No code was moved or deleted

### **About Deployment Safety**

**Safe deployment practices:**
- Test infrastructure on port 8080 first
- Use hub.thegraph.foundation as staging
- Verify thoroughly before cutover
- Keep old infrastructure running until cutover complete

### **About SSL/TLS**

**Recommended setup:**
- Use Let's Encrypt with certbot
- Cloudflare DNS-only mode (grey cloud)
- Automatic certificate renewals via cron
- TLS termination on your nginx

**Why not Cloudflare Full SSL:**
- Had issues with direct domain access in the past
- Less control over certificates
- Complicated troubleshooting

### **About Testing**

**E2E tests:**
- 52 tests with Playwright
- Tests real user interactions
- Verifies navigation, rendering, functionality
- Run before deploying to production

**To run tests:**
```bash
cd infrastructure/tests/e2e
npm install
npx playwright install chromium
BASE_URL=http://localhost:8080 npm test
```

### **About Development Workflow**

**Consistent pattern for both apps:**
```bash
# 1. Make code changes
# 2. Test locally
# 3. Commit changes
git commit -m "Description"

# 4. Push to GitHub
git push origin main

# 5. GitHub Actions builds Docker image automatically
# 6. Pull image on server (if needed)
docker pull ghcr.io/...

# 7. Deploy
cd ../dashboard-infrastructure
./deploy.sh
```

### **About Rollbacks**

**If deployment fails:**
```bash
# Stop current deployment
docker compose down

# Start previous version
docker compose up -d

# Or use specific image tag
docker compose up -d --force-recreate
```

### **About Data Persistence**

**Important notes:**
- Docker volumes store generated HTML
- Volumes persist across container restarts
- Volumes are NOT backed up automatically
- Backup strategy recommended for critical data

### **About Monitoring**

**What to monitor:**
- Container health: `docker compose ps`
- Scheduler logs: `docker compose logs -f grumpygoose-scheduler reo-scheduler`
- Nginx access logs: `docker compose logs nginx`
- Disk space: `df -h`
- Certificate expiry: `docker compose run --rm certbot certificates`

---

## 🔗 USEFUL LINKS

### **Repositories**
- Grumpy Goose: https://github.com/graphprotocol/grumpygoose
- REO: https://github.com/graphprotocol/rewards-eligibility-oracle-dashboard
- Infrastructure: https://github.com/p-diogo/dashboard-infrastructure

### **Documentation**
- Infrastructure README: `dashboard-infrastructure/README.md`
- Deployment Guide: `dashboard-infrastructure/DEPLOYMENT_GUIDE.md`
- Implementation Summary: `dashboard-infrastructure/IMPLEMENTATION_SUMMARY.md`
- Let's Encrypt Setup: `dashboard-infrastructure/LETSENCRYPT_SETUP.md` ⭐
- Cloudflare SSL Setup: `dashboard-infrastructure/SSL_SETUP.md`

### **Docker Images**
- Grumpy Goose: `ghcr.io/graphprotocol/grumpygoose:latest`
- REO: `ghcr.io/graphprotocol/rewards-eligibility-oracle-dashboard:latest` ✅

### **GitHub Actions**
- REO Workflow: https://github.com/graphprotocol/rewards-eligibility-oracle-dashboard/actions

---

## 📞 GETTING HELP

### **If Something Goes Wrong**

1. **Check the logs first**
   ```bash
   docker compose logs -f
   ```

2. **Check container status**
   ```bash
   docker compose ps
   ```

3. **Review this document**
   - Look for similar issues in Troubleshooting section
   - Check Commands section for correct syntax

4. **Check GitHub Issues**
   - Search repos for similar problems
   - Review recent commits

5. **Revert if needed**
   ```bash
   git log --oneline
   git revert <commit-hash>
   ```

### **Useful Debugging Commands**

```bash
# Check what's listening on ports
sudo netstat -tulpn | grep LISTEN

# Check Docker volumes
docker volume ls | grep dashboards

# Inspect a volume
docker volume inspect goose-output

# Get container IP
docker inspect dashboards-nginx | grep IPAddress

# Enter container for debugging
docker compose exec nginx sh
docker compose exec grumpygoose-scheduler sh
docker compose exec reo-scheduler sh

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

---

## ✅ CHECKLIST

### **Before First Deployment**

- [ ] DNS record created for `hub.thegraph.foundation`
- [ ] Cloudflare set to DNS-only (grey cloud)
- [ ] REO `.env` file created from `env.example`
- [ ] `.env` file has correct API keys and configuration
- [ ] Firewall allows ports 80 and 443
- [ ] Docker and Docker Compose installed
- [ ] User has sudo access for certbot (if using Let's Encrypt)

### **During Deployment**

- [ ] Containers start successfully
- [ ] Nginx is healthy
- [ ] Grumpy Goose generates dashboard
- [ ] REO generates dashboard
- [ ] Scheduler containers are running
- [ ] Logs show no errors

### **After Deployment**

- [ ] Hub page accessible at `http://hub.thegraph.foundation`
- [ ] Grumpy Goose accessible at `http://hub.thegraph.foundation/goose`
- [ ] REO accessible at `http://hub.thegraph.foundation/reo`
- [ ] Health check returns 200: `curl http://hub.thegraph.foundation/health`
- [ ] SSL certificate installed (if using HTTPS)
- [ ] HTTPS redirects work: `curl -I http://hub.thegraph.foundation` returns 301
- [ ] HTTPS works: `curl -I https://hub.thegraph.foundation` returns 200
- [ ] Browser shows no certificate warnings
- [ ] E2E tests pass (optional but recommended)

### **Before Production Cutover**

- [ ] All tests pass on hub
- [ ] SSL is working correctly
- [ ]Schedulers are updating dashboards
- [ ] Monitoring is in place
- [ ] Backup strategy is defined
- [ ] Rollback plan is documented

---

## 📊 SUMMARY

### **What You Have Now**

✅ **Two Production Apps** with consistent workflows
✅ **Unified Infrastructure** for easy deployment
✅ **Beautiful Dashboard Hub** for navigation
✅ **Comprehensive Testing** (52 e2e tests)
✅ **Multiple SSL Options** to choose from
✅ **Complete Documentation** for everything
✅ **No Breaking Changes** to existing apps

### **What You Need to Do**

1. Create DNS record for `hub.thegraph.foundation`
2. Set up SSL (Let's Encrypt recommended)
3. Deploy and test thoroughly
4. Cutover `dashboards.thegraph.foundation` when ready
5. Use `hub` as staging environment

### **When You're Ready**

Everything is in GitHub, all documentation is written, and all commands are provided above.

**Just follow the deployment plan in Phase 3!** 🚀

---

**End of Master Plan**

Last updated: 2025-01-18
Saved location: `/home/pdiogo/hosted-apps/repos/dashboard-infrastructure/MASTER_PLAN.md`
