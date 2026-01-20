# REO Dashboard Authentication

The Rewards Eligibility Oracle (REO) dashboard is protected by email-based OTP (One-Time Password) authentication.

## How It Works

1. User visits `/reo`
2. If not authenticated, redirected to `/reo/login`
3. User enters email address
4. System sends 6-digit code via email
5. User enters code to authenticate
6. Session cookie set (valid for 7 days)

## Configuration

### 1. Email Whitelist

Edit `config/allowed_emails.txt`:

```
# Whitelisted emails for REO dashboard access
# Use wildcards for entire domains

user@thegraph.foundation
*@thegraph.foundation
*@partner-domain.com
```

### 2. SMTP Settings

Create a `.env` file in the project root:

```bash
# Gmail SMTP (recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@thegraph.foundation
SMTP_PASSWORD=<app-specific-password>
SMTP_FROM="The Graph Dashboards <info@thegraph.org>"

# Session security
SESSION_SECRET=<random-32-char-string>

# Optional: Override defaults
OTP_EXPIRY_MINUTES=10
SESSION_EXPIRY_DAYS=7
RATE_LIMIT_PER_HOUR=5
```

**Generate SESSION_SECRET:**
```bash
openssl rand -hex 32
```

### 3. Gmail App Password

If using Gmail:

1. Enable 2FA on your Google account
2. Go to Security → App passwords
3. Generate new app password (name: "REO Dashboard Auth")
4. Use the 16-character password in `SMTP_PASSWORD`

## Deployment

```bash
# Build and start auth service
docker compose up -d --build auth-gate

# Verify it's running
docker compose logs -f auth-gate

# Check health
curl http://localhost:8000/health
```

## Architecture

```
User → /reo
  ↓
nginx (checks session cookie)
  ↓
  ├─ No cookie: → /reo/login
  └─ Has cookie: → auth-gate /validate
      ↓
      ├─ Valid: → /reo/index.html
      └─ Invalid: → /reo/login
```

**Components:**
- **auth-gate**: FastAPI service (port 8000)
  - Generates and validates OTP codes
  - Manages sessions
  - Sends emails
- **nginx**: Reverse proxy with `auth_request`
- **reo-login**: Static login page

## API Endpoints

### `POST /reo/api/request-otp`
Request an OTP code via email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP code sent to your email",
  "expires_in": 600
}
```

### `POST /reo/api/verify-otp`
Verify OTP code and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Authentication successful",
  "email": "user@example.com"
}
```

**Cookie:** Sets `reo_session` (HttpOnly, 7-day expiry)

### `POST /reo/api/logout`
Invalidate session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Security Features

- **Session cookies**: HttpOnly, SameSite=lax
- **OTP storage**: SHA256 hashed
- **Rate limiting**: 5 requests per hour per email
- **OTP expiry**: 10 minutes
- **Session expiry**: 7 days
- **Email whitelist**: Wildcard domain support
- **Non-root container**: Runs as `auth:auth` user

## Troubleshooting

### Emails not sending

```bash
# Check auth-gate logs
docker compose logs auth-gate

# Verify SMTP settings
docker compose exec auth-gate env | grep SMTP

# Test email manually
docker compose exec auth-gate python -c "
from infrastructure.auth.email import get_email_sender
sender = get_email_sender()
print(sender.send_otp_email('test@example.com', '123456'))
"
```

### "Email not authorized" error

- Check `config/allowed_emails.txt` exists
- Verify email format is correct
- Check wildcard patterns use `*@domain.com` format

### Session not persisting

- Check `SESSION_SECRET` is set
- Verify cookie is being set (browser DevTools)
- Check nginx `auth_request` is configured

### Rate limit hit

Wait 1 hour or restart auth-gate:
```bash
docker compose restart auth-gate
```

## Monitoring

### Check active sessions

```bash
curl http://localhost:8000/stats
```

**Response:**
```json
{
  "active_otps": 2,
  "active_sessions": 5,
  "rate_limit_entries": 3,
  "whitelist_entries": 10
}
```

### View API docs

Visit http://localhost:8000/docs (when running locally)

## Customization

### Change email template

Edit `infrastructure/auth/templates/email.html`

### Change login page design

Edit `infrastructure/nginx/reo-login/index.html`

### Adjust session expiry

Set `SESSION_EXPIRY_DAYS` in `.env`

### Adjust rate limit

Set `RATE_LIMIT_PER_HOUR` in `.env`

## Production Checklist

- [ ] Set strong `SESSION_SECRET`
- [ ] Configure SMTP credentials
- [ ] Add authorized emails to whitelist
- [ ] Test email delivery
- [ ] Verify authentication flow
- [ ] Check rate limiting works
- [ ] Test session persistence
- [ ] Verify HTTPS (session cookies require secure flag)
- [ ] Add GRT logo (`infrastructure/auth/templates/grt_logo.png`)
