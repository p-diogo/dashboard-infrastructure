# SSL Setup Guide for Cloudflare Full SSL

This guide shows how to set up **Cloudflare Full SSL with Origin CA** - no certificate renewals needed!

## Why This Approach?

**Current (Flexible SSL):**
```
User → Cloudflare (TLS) → Your Server (HTTP) ❌
       Not secure between Cloudflare and your server!
```

**Better (Full SSL + Origin CA):**
```
User → Cloudflare (TLS) → Your Server (TLS) ✅
       End-to-end encryption
       No cert renewals needed
```

---

## 📋 Step-by-Step Setup

### Step 1: Generate Cloudflare Origin CA Certificate

1. Go to **Cloudflare Dashboard**
2. Select your domain (`hub.thegraph.foundation` or `dashboards.thegraph.foundation`)
3. Go to **SSL/TLS** → **Origin Server**
4. Click **Create Certificate**
5. Configure:
   - **Hostnames**: `hub.thegraph.foundation`, `dashboards.thegraph.foundation`
   - **Hostnames**: `*.hub.thegraph.foundation`, `*.dashboards.thegraph.foundation` (for subdomains)
   - **Validity**: **15 years**
   - **Key Type**: **RSA (2048)**
6. Click **Create**
7. You'll see two boxes:
   - **Origin Certificate** (PEM format)
   - **Private Key** (PEM format)

### Step 2: Save Certificates Locally

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure/infrastructure/nginx
```

Create the certificate file:
```bash
cat > cloudflare-origin.crt << 'EOF'
-----BEGIN CERTIFICATE-----
[PASTE THE ORIGIN CERTIFICATE HERE]
-----END CERTIFICATE-----
EOF
```

Create the private key file:
```bash
cat > cloudflare-origin.key << 'EOF'
-----BEGIN PRIVATE KEY-----
[PASTE THE PRIVATE KEY HERE]
-----END PRIVATE KEY-----
EOF
```

**IMPORTANT: Never commit these files to git!** (They're already in .gitignore)

### Step 3: Change Cloudflare SSL Mode

In Cloudflare Dashboard:
1. Go to **SSL/TLS** → **Overview**
2. Change from **Flexible** to **Full (strict)**
3. Click Save

### Step 4: Deploy with SSL

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Deploy with SSL enabled
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

This uses both docker-compose files:
- `docker-compose.yml` - Base configuration
- `docker-compose.ssl.yml` - SSL overrides (adds port 443, certificates, ssl config)

---

## 🧪 Verification

### Check HTTP redirects to HTTPS:
```bash
curl -I http://hub.thegraph.foundation
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://hub.thegraph.foundation/
```

### Check HTTPS works:
```bash
curl -I https://hub.thegraph.foundation
# Should return: HTTP/2 200
```

### Check certificate in browser:
1. Visit https://hub.thegraph.foundation
2. Click the lock icon in the address bar
3. Should show certificate issued by "Cloudflare"

---

## 📁 File Structure

```
infrastructure/nginx/
├── nginx.conf              # HTTP-only config (for testing)
├── nginx-ssl.conf          # HTTPS config (production)
├── cloudflare-origin.crt   # Origin certificate (you create)
├── cloudflare-origin.key   # Private key (you create)
└── hub/
    └── index.html
```

---

## 🔄 Deployment Commands

### **HTTP-only (for testing):**
```bash
docker compose up -d
```

### **HTTPS (production):**
```bash
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

### **View logs:**
```bash
docker compose -f docker-compose.yml -f docker-compose.ssl.yml logs -f nginx
```

### **Stop:**
```bash
docker compose -f docker-compose.yml -f docker-compose.ssl.yml down
```

---

## 🎯 Benefits

✅ **No cert renewals** - Cloudflare Origin CA is valid for 15 years
✅ **Full encryption** - End-to-end from user to your server
✅ **Automatic** - No Let's Encrypt, no certbot, no cron jobs
✅ **Free** - Included with Cloudflare
✅ **Secure** - Only Cloudflare can communicate with your origin

---

## 🔒 Security Notes

- The `.key` file is **never** committed to git
- Certificates are stored on your server only
- Cloudflare automatically validates the certificate
- Only Cloudflare can connect to your origin (prevents direct access)

---

## 🌐 Cloudflare IP Ranges

The nginx config includes all Cloudflare IP ranges, so:
- Real client IPs are preserved in logs
- Only Cloudflare can connect to your origin
- Direct IP access is blocked (won't present valid certificate)

---

## ❓ Troubleshooting

### **"SSL handshake failed"**
- Make sure you changed Cloudflare to "Full (strict)" mode
- Verify certificate files exist and are readable
- Check nginx error logs: `docker compose logs nginx`

### **"Certificate expired"**
- Should not happen! Origin CA is valid for 15 years
- Check if Cloudflare is still using the correct certificate

### **"Too many redirects"**
- Make sure nginx is listening on port 443
- Check if port 443 is exposed in docker-compose.ssl.yml

---

## 📚 Additional Resources

- [Cloudflare SSL/TLS Modes](https://developers.cloudflare.com/ssl/tls/)
- [Cloudflare Origin Certificates](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)

---

Created: 2025-01-18
