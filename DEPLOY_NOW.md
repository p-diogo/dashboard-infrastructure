# 🚀 Complete Deployment Guide
**Deploy Dashboard Hub + Updated Grumpy Goose (with bug fixes)**

**Created:** 2025-01-20
**Purpose:** Deploy the unified dashboard infrastructure with the NEW Grumpy Goose image that has:
- ✅ Fixed scheduler signature updates
- ✅ Fixed Safe App network prefix (arb1)

---

## 📋 OVERVIEW

**What you're deploying:**
1. **Dashboard Hub** at `hub.thegraph.foundation` - Central landing page
2. **Grumpy Goose** at `hub.thegraph.foundation/goose` - Governance dashboard (with bug fixes!)
3. **REO** at `hub.thegraph.foundation/reo` - Rewards eligibility dashboard

**What's new in this Grumpy Goose image:**
- Bug #1 Fixed: Scheduler now updates signatures on existing transactions
- Bug #2 Fixed: Safe App links use correct `arb1:` prefix (not `arb:`)

---

## ⚠️ PREREQUISITES

Before starting, verify:
- [ ] You have access to the server where these will run
- [ ] You have Cloudflare access for `thegraph.foundation`
- [ ] Docker and Docker Compose are installed on the server
- [ ] REO `.env` file exists (or you'll create it)

---

## 📝 STEP 1: Cloudflare DNS Setup (5 minutes)

### 1.1 Log in to Cloudflare
- Go to https://dash.cloudflare.com/sign-in
- Sign in with your credentials

### 1.2 Select Domain
- In the search bar, type: `thegraph.foundation`
- Click on the domain

### 1.3 Add DNS Record for hub.thegraph.foundation
- Click **DNS** → **Records** (left sidebar)
- Click **Add record** (blue button)
- Configure:
  - **Type:** `A`
  - **Name:** `hub`
  - **IPv4 address:** `YOUR_SERVER_IP` (e.g., `164.90.123.45`)
  - **Proxy status:** Click cloud icon until it's **GREY** (DNS only)
  - **TTL:** Auto
- Click **Save**

### 1.4 Verify DNS Propagation
```bash
# Wait 5-10 minutes, then test:
nslookup hub.thegraph.foundation
# Should return your server IP
```

**⚠️ IMPORTANT:** The cloud icon must be **GREY** (not orange)
- Grey = DNS only (what we want)
- Orange = Proxied (not what we want)

---

## 🔧 STEP 2: Prepare REO Environment (2 minutes)

The REO dashboard needs environment variables:

```bash
cd /home/pdiogo/hosted-apps/repos/rewards-eligibility-oracle-dashboard

# Create .env from example
cp env.example .env

# Edit with your actual values
nano .env  # Or use vi, vim, etc.
```

**Required variables in `.env`:**
- `GRAPH_API_KEY` - The Graph API key
- `ARBISCAN_API_KEY` - Arbiscan API key
- `RPC_ENDPOINT` - Arbitrum RPC endpoint
- (See `env.example` for full list)

Save and exit when done.

---

## 🚀 STEP 3: Deploy Infrastructure (5-10 minutes)

### 3.1 Clone/Pull Infrastructure Repo

```bash
# If repo doesn't exist yet
cd /home/pdiogo/hosted-apps/repos
git clone git@github.com:p-diogo/dashboard-infrastructure.git
cd dashboard-infrastructure

# OR if it already exists
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure
git pull origin main
```

### 3.2 Deploy with Let's Encrypt (Recommended)

**Step 3.2.1: Deploy HTTP-first**
```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Deploy all containers (HTTP only initially)
docker compose -f docker-compose.letsencrypt.yml up -d

# Expected output:
# - Creating network "dashboards-network"
# - Creating volume "goose-output"
# - Creating volume "reo-output"
# - Creating volume "certbot-etc"
# - Creating volume "certbot-var"
# - Creating container dashboards-nginx
# - Creating container dashboards-certbot
# - Creating container grumpygoose-prod
# - Creating container grumpygoose-scheduler-prod
# - Creating container reo-prod
# - Creating container reo-scheduler-prod
```

**Step 3.2.2: Verify HTTP works**
```bash
# Wait 30 seconds for containers to start
sleep 30

# Check all containers are running
docker compose -f docker-compose.letsencrypt.yml ps
# All should show "Up" status

# Test hub page
curl http://hub.thegraph.foundation
# Should return HTML with "The Graph Dashboard Hub"

# Test Grumpy Goose
curl http://hub.thegraph.foundation/goose | grep -o "<title>.*</title>"
# Should return Grumpy Goose title

# Test REO
curl http://hub.thegraph.foundation/reo | grep -o "<title>.*</title>"
# Should return REO title
```

**Step 3.2.3: Generate SSL Certificate**
```bash
# IMPORTANT: Replace with your actual email!
docker compose -f docker-compose.letsencrypt.yml run --rm certbot \
  certonly --webroot \
  -w /var/www/certbot \
  -d hub.thegraph.foundation \
  --email YOUR_EMAIL@example.com \
  --agree-tos \
  --no-eff-email

# Expected output:
# - Successfully received certificate
# - Certificate is saved at: /etc/letsencrypt/live/hub.thegraph.foundation/fullchain.pem
# - Key is saved at: /etc/letsencrypt/live/hub.thegraph.foundation/privkey.pem
```

**Step 3.2.4: Enable HTTPS**
```bash
# Restart nginx to load SSL certificates
docker compose -f docker-compose.letsencrypt.yml restart nginx

sleep 5

# Verify HTTPS works
curl -I https://hub.thegraph.foundation
# Should return: HTTP/2 200
```

### 3.3 Alternative: HTTP Only (Testing Only)

If you want to test without SSL first:

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Deploy HTTP only
docker compose up -d

# Access at http://hub.thegraph.foundation
```

---

## ✅ STEP 4: Verify Deployment

### 4.1 Check All Dashboards

```bash
# Test hub
curl -I https://hub.thegraph.foundation
# Should return: HTTP/2 200

# Test Grumpy Goose
curl -I https://hub.thegraph.foundation/goose
# Should return: HTTP/2 200

# Test REO
curl -I https://hub.thegraph.foundation/reo
# Should return: HTTP/2 200
```

### 4.2 Check Scheduler Logs

```bash
# Grumpy Goose scheduler (should show incremental updates)
docker compose -f docker-compose.letsencrypt.yml logs grumpygoose-scheduler-prod --tail=30

# REO scheduler
docker compose -f docker-compose.letsencrypt.yml logs reo-scheduler-prod --tail=30
```

### 4.3 Verify Bug Fixes

**Open in browser:** https://hub.thegraph.foundation/goose

**Check Fix #1 - Signatures updating:**
1. Find the Safe transaction with nonce shown in Safe App
2. Compare signature count with https://app.safe.global/transactions/queue?safe=arb1:0x8C6de8F8D562f3382417340A6994601eE08D3809
3. Should show 4 signatures (not 1)
4. Wait 5 minutes and refresh - scheduler should pick up new signatures

**Check Fix #2 - Safe App links:**
1. Hover over "🔗 View in Safe App" link
2. Should show: `https://app.safe.global/transactions/queue?safe=arb1:0x8C6de...`
3. NOT: `arb:0x8C6de...` (wrong)

---

## 🔄 STEP 5: Set Up Auto-Renewal (SSL Only)

If you deployed with Let's Encrypt, set up automatic certificate renewal:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 3am):
0 3 * * * cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure && docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew --quiet && docker compose -f docker-compose.letsencrypt.yml restart nginx > /var/log/certbot-renew.log 2>&1

# Save and exit (in nano: Ctrl+X, then Y, then Enter)
```

---

## 📊 WHAT YOU SHOULD SEE

### Hub Page (https://hub.thegraph.foundation)
- Welcome message: "The Graph Protocol Dashboard Hub"
- Two dashboard cards:
  - **Grumpy Goose** 🪿 - Governance oversight
  - **Rewards Eligibility Oracle** 🍪 - GIP-0079 eligibility
- Status indicators showing "Live"
- Clickable links to each dashboard

### Grumpy Goose (https://hub.thegraph.foundation/goose)
- Active Snapshot proposals
- Pending Safe transactions (with CORRECT signature counts!)
- Active Notion proposals
- Safe App links using `arb1:` prefix (CORRECT!)

### REO (https://hub.thegraph.foundation/reo)
- Indexer eligibility table
- GIP-0079 compliance status
- Performance metrics

---

## 🛠️ COMMON COMMANDS

```bash
# View all containers
docker compose -f docker-compose.letsencrypt.yml ps

# View logs
docker compose -f docker-compose.letsencrypt.yml logs -f

# Restart everything
docker compose -f docker-compose.letsencrypt.yml restart

# Stop everything
docker compose -f docker-compose.letsencrypt.yml down

# Pull latest Grumpy Goose image
docker compose -f docker-compose.letsencrypt.yml pull grumpygoose

# Restart specific service
docker compose -f docker-compose.letsencrypt.yml restart grumpygoose-scheduler-prod
```

---

## 🐛 TROUBLESHOOTING

### "Connection refused" on port 443
```bash
# Check if port 443 is exposed
docker compose -f docker-compose.letsencrypt.yml ps
# Look for "0.0.0.0:443->443/tcp" under nginx

# Check firewall
sudo ufw status
sudo ufw allow 443/tcp
```

### "Certificate not found" error
```bash
# Verify certbot ran successfully
docker compose -f docker-compose.letsencrypt.yml logs certbot

# Re-run certificate generation
docker compose -f docker-compose.letsencrypt.yml run --rm certbot \
  certonly --webroot \
  -w /var/www/certbot \
  -d hub.thegraph.foundation \
  --email YOUR_EMAIL@example.com \
  --agree-tos \
  --no-eff-email
```

### Scheduler not updating signatures
```bash
# Check scheduler logs
docker compose -f docker-compose.letsencrypt.yml logs grumpygoose-scheduler-prod --tail=50

# Manually trigger incremental update
docker compose -f docker-compose.letsencrypt.yml exec grumpygoose-scheduler-prod \
  python -c "import incremental_update; incremental_update.check_and_update_incremental()"
```

### REO shows errors
```bash
# Check REO logs
docker compose -f docker-compose.letsencrypt.yml logs reo-prod --tail=50

# Verify .env file exists
cat /home/pdiogo/hosted-apps/repos/rewards-eligibility-oracle-dashboard/.env

# Restart REO
docker compose -f docker-compose.letsencrypt.yml restart reo-prod reo-scheduler-prod
```

---

## 📞 NEXT STEPS

After successful deployment:

1. **Monitor for 24 hours** - Check that schedulers are running smoothly
2. **Verify signature updates** - Safe transactions should show correct signature counts
3. **Test Safe App links** - All should use `arb1:` prefix
4. **Plan production cutover** - Eventually switch `dashboards.thegraph.foundation` to this infrastructure

---

## 🎉 SUCCESS!

You now have:
- ✅ Unified dashboard hub at `hub.thegraph.foundation`
- ✅ Grumpy Goose with FIXED signature updates
- ✅ Grumpy Goose with FIXED Safe App links (`arb1:` prefix)
- ✅ REO dashboard fully integrated
- ✅ Automatic updates every 5 minutes
- ✅ SSL with Let's Encrypt (auto-renewing)

**Next:** Monitor logs and verify signature counts are updating correctly!
