# Let's Encrypt SSL Setup Guide

Complete guide for setting up automated SSL certificates with Let's Encrypt and certbot.

## 🎯 Architecture

```
User → Cloudflare (DNS only, grey cloud) → Your Server (nginx + TLS termination) → Docker Apps
                                            Let's Encrypt (certbot)
                                            Auto-renews every 90 days
```

---

## 📋 Step-by-Step Setup

### **Step 1: Cloudflare DNS Configuration**

1. Go to **Cloudflare Dashboard**
2. Navigate to **DNS** → **Records**
3. Find `hub.thegraph.foundation`
4. Click the **Orange cloud** icon (proxy status)
5. It turns **Grey** (DNS only mode)
   - ✅ Cloudflare provides DNS resolution
   - ❌ Cloudflare does NOT proxy traffic
   - ✅ Your nginx handles TLS directly

### **Step 2: Deploy with HTTP-Only**

First, deploy the infrastructure without SSL to generate certificates:

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Deploy with HTTP-only config
docker compose -f docker-compose.letsencrypt.yml up -d
```

Verify HTTP works:
```bash
curl http://hub.thegraph.foundation
# Should return the hub page HTML
```

### **Step 3: Generate Let's Encrypt Certificates**

Run certbot to generate certificates for your domain:

```bash
# Generate certificate for hub.thegraph.foundation
docker compose -f docker-compose.letsencrypt.yml run --rm certbot \
  certonly --webroot \
  -w /var/www/certbot \
  -d hub.thegraph.foundation \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Add additional domains (if needed)
docker compose -f docker-compose.letsencrypt.yml run --rm certbot \
  certonly --webroot \
  -w /var/www/certbot \
  -d hub.thegraph.foundation \
  -d dashboards.thegraph.foundation \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  --expand
```

**Replace `your-email@example.com` with your actual email.**

### **Step 4: Update Nginx Config for HTTPS**

The nginx config already supports SSL. Just uncomment the redirect:

In `infrastructure/nginx/nginx-letsencrypt.conf`:
```nginx
# Uncomment this line:
# return 301 https://$server_name$request_uri;
```

Actually, the config is already set up! Just restart nginx:

```bash
docker compose -f docker-compose.letsencrypt.yml restart nginx
```

### **Step 5: Verify HTTPS**

```bash
# Test HTTP redirects to HTTPS
curl -I http://hub.thegraph.foundation
# Should return: HTTP/1.1 301 Moved Permanently

# Test HTTPS works
curl -I https://hub.thegraph.foundation
# Should return: HTTP/2 200
```

Visit in browser: https://hub.thegraph.foundation ✅

---

## 🔄 Certificate Renewal

### **Manual Renewal**

```bash
# Renew certificates
docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew

# Restart nginx to load new certificates
docker compose -f docker-compose.letsencrypt.yml restart nginx
```

### **Automatic Renewal (Recommended)**

Create a cron job to auto-renew:

```bash
# Edit crontab
crontab -e

# Add this line (renews at 3am daily, restarts nginx)
0 3 * * * cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure && docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew --quiet && docker compose -f docker-compose.letsencrypt.yml restart nginx > /var/log/certbot-renew.log 2>&1
```

### **Test Renewal**

```bash
# Test renewal process (dry run)
docker compose -f docker-compose.letsencrypt.yml run --rm certbot renew --dry-run
```

---

## 📁 File Structure

```
infrastructure/
├── nginx/
│   ├── nginx.conf              # HTTP-only (original)
│   ├── nginx-letsencrypt.conf  # HTTPS with Let's Encrypt
│   └── hub/
│       └── index.html
└── docker-compose.letsencrypt.yml
```

### **Certificate Locations** (Docker Volumes)
```
certbot-etc:/etc/letsencrypt/
├── live/
│   └── hub.thegraph.foundation/
│       ├── fullchain.pem  # Certificate
│       └── privkey.pem    # Private key
└── renewal/               # Renewal configuration
```

---

## 🎯 Certificate Lifecycle

| Day | Action |
|-----|--------|
| Day 0 | Initial setup, generate certificates (valid 90 days) |
| Day 30 | Auto-renewal check (cron) - no action needed |
| Day 60 | Auto-renewal check (cron) - renews if needed |
| Day 90 | Auto-renewal check (cron) - definitely renews |

Let's Encrypt certificates are valid for **90 days**, but certbot will automatically renew them **30 days before expiration**.

---

## 🔒 Security Benefits

✅ **TLS termination on your server** - Full control
✅ **Automatic renewals** - Set and forget
✅ **Free certificates** - No cost
✅ **Trusted by all browsers** - No certificate warnings
✅ **Real client IPs** - No Cloudflare proxy in the way

---

## 🌐 Domain Support

### **Single Domain**
```bash
-d hub.thegraph.foundation
```

### **Multiple Domains**
```bash
-d hub.thegraph.foundation -d dashboards.thegraph.foundation
```

### **Wildcard Domain** (requires DNS challenge)
```bash
-d *.hub.thegraph.foundation
```

---

## 🐛 Troubleshooting

### **"Connection refused" on port 443**
- Make sure port 443 is exposed in docker-compose
- Check firewall: `sudo ufw allow 443/tcp`

### **"Certificate expired"**
- Run: `docker compose run --rm certbot renew`
- Check renewal cron is running

### **"Too many redirects"**
- Make sure HTTPS server block is enabled in nginx config
- Check cert generated successfully

### **"Permission denied" on certificate files**
- Check Docker volumes are mounted correctly
- Verify certbot-etc volume exists

### **View Certbot Logs**
```bash
docker compose logs certbot
```

### **Check Certificate Expiry**
```bash
docker compose run --rm certbot certificates
```

---

## 🔄 Deployment Commands

### **Deploy with Let's Encrypt SSL**
```bash
# Initial deployment
docker compose -f docker-compose.letsencrypt.yml up -d

# Generate certificates
docker compose -f docker-compose.letsencrypt.yml run --rm certbot certonly --webroot -w /var/www/certbot -d hub.thegraph.foundation --email your-email@example.com --agree-tos

# Restart nginx
docker compose -f docker-compose.letsencrypt.yml restart nginx
```

### **View Logs**
```bash
docker compose -f docker-compose.letsencrypt.yml logs -f nginx
docker compose -f docker-compose.letsencrypt.yml logs -f certbot
```

### **Stop Services**
```bash
docker compose -f docker-compose.letsencrypt.yml down
```

---

## 📚 Additional Resources

- [Certbot Documentation](https://certbot.eff.org/)
- [Let's Encrypt Website](https://letsencrypt.org/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)

---

Created: 2025-01-18
