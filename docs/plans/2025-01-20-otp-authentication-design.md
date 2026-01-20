# OTP Authentication for REO Dashboard

**Date:** 2025-01-20
**Author:** Design Document
**Status:** Approved

## Overview

Add email-based OTP (One-Time Password) authentication to protect the `/reo` dashboard route while keeping `/` (hub) and `/goose` (Grumpy Goose) publicly accessible.

## Requirements

- Protect only `/reo` route with OTP authentication
- Separate Docker container for auth service
- Use nginx `auth_request` module for integration
- Email whitelist with wildcard domain support
- Gmail SMTP integration using app-specific password
- Official The Graph branding (Poppins font)

## Architecture

### High-Level Flow

```
User requests /reo
  ↓
nginx checks for session cookie
  ↓
  ├─ No cookie: Serve /reo/login.html
  └─ Cookie exists: Ask auth service via auth_request
      ↓
      ├─ Valid: Serve /reo/index.html
      └─ Invalid: Redirect to /reo/login
```

### Components

#### 1. FastAPI Auth Container (`auth-gate`)
- Lightweight FastAPI service
- Endpoints:
  - `GET /validate` - Internal, called by nginx auth_request
  - `POST /reo/api/request-otp` - Request OTP code
  - `POST /reo/api/verify-otp` - Verify OTP and create session
  - `POST /reo/api/logout` - Invalidate session
- In-memory state storage (OTP codes, rate limits)
- Docker volume for persistent configuration

#### 2. Nginx Changes
- Add `auth_request /auth-proxy;` to `/reo` location block
- New internal location `/auth-proxy` proxies to auth-gate container
- New location `/reo/login` serves static login page
- New location `/reo/api/` proxies OTP endpoints to auth-gate

#### 3. Login Page
- Static HTML file served by nginx
- Pure JavaScript makes API calls to `/reo/api/` endpoints
- On success, sets cookie and redirects to `/reo/`

## FastAPI Auth Service

### API Endpoints

#### GET /validate
**Purpose:** Internal endpoint called by nginx auth_request module

**Request:**
- Headers: Cookie containing session token

**Response:**
- `200 OK` - Session valid
- `401 Unauthorized` - Session invalid or missing
- `403 Forbidden` - Session expired

**Note:** No response body (nginx only cares about status code)

#### POST /reo/api/request-otp
**Purpose:** Request OTP code via email

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
- `200 OK` - OTP sent successfully
- `400 Bad Request` - Invalid email format
- `403 Forbidden` - Email not in whitelist
- `429 Too Many Requests` - Rate limit exceeded (5 requests/hour)

#### POST /reo/api/verify-otp
**Purpose:** Verify OTP code and create session

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
- `200 OK` - Sets session cookie (7-day expiry)
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Invalid or expired OTP code

#### POST /reo/api/logout
**Purpose:** Invalidate session

**Response:**
- `200 OK` - Session invalidated, cookie cleared

### In-Memory State

```python
# OTP storage (email -> code data)
otp_codes = {
    "user@example.com": {
        "code_hash": "sha256_hash",
        "expires": "2025-01-20T12:00:00Z"
    }
}

# Rate limiting (email -> request tracking)
rate_limits = {
    "user@example.com": {
        "count": 3,
        "window_start": "2025-01-20T11:00:00Z"
    }
}

# Active sessions (token -> user data)
sessions = {
    "session_token": {
        "email": "user@example.com",
        "expires": "2025-01-27T12:00:00Z"
    }
}
```

### Security Features

- Session cookies signed with HMAC using secret from environment
- OTP codes stored hashed (SHA256)
- CORS disabled (same-origin only)
- Request validation via Pydantic models
- Rate limiting: 5 OTP requests per hour per email
- OTP expiry: 10 minutes
- Session expiry: 7 days

## Email Configuration

### Whitelist File

**Location:** `/config/allowed_emails.txt`

**Format:**
```
# Whitelisted emails for REO dashboard access
# Lines starting with # are comments
# Use wildcards for entire domains

user@thegraph.foundation
*@thegraph.foundation
*@partner-domain.com

# Specific external collaborators
alice@external.org
bob@another-company.com
```

**Validation Logic:**
1. Check exact email match first
2. Check wildcard patterns (`*@domain.com`)
3. Ignore comment lines (starting with `#`) and empty lines

### Email Template

**Design:** The Graph branding with Poppins font (open-source alternative to Euclid Circular A)

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background: #f4f4f4;">
  <div style="max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

    <!-- Header with GRT Logo -->
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="cid:grt_logo.png" alt="The Graph" style="height: 50px;">
    </div>

    <!-- Main Heading -->
    <h1 style="font-family: 'Poppins', Arial, sans-serif; font-weight: 600; color: #6B46C1; margin: 0 0 20px 0; font-size: 24px;">
      Your REO Dashboard Access Code
    </h1>

    <!-- Body Copy -->
    <p style="font-family: 'Poppins', Arial, sans-serif; font-weight: 400; color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
      You requested access to the Rewards Eligibility Oracle dashboard. Use this verification code to sign in:
    </p>

    <!-- OTP Code Display -->
    <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E9D8FD 100%); padding: 25px; text-align: center; border-radius: 12px; margin: 30px 0; border: 2px solid #9F7AEA;">
      <span style="font-family: 'Poppins', Arial, sans-serif; font-size: 36px; font-weight: 600; color: #6B46C1; letter-spacing: 10px;">
        {{ CODE }}
      </span>
    </div>

    <!-- Expiry Info -->
    <p style="font-family: 'Poppins', Arial, sans-serif; font-weight: 400; color: #718096; font-size: 14px; margin: 0;">
      This code expires in <strong>10 minutes</strong>
    </p>

    <!-- Divider -->
    <div style="border-top: 1px solid #E2E8F0; margin: 30px 0;"></div>

    <!-- Footer -->
    <p style="font-family: 'Poppins', Arial, sans-serif; font-weight: 400; color: #A0AEC0; font-size: 12px; margin: 0;">
      If you didn't request this code, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
```

**Typography:**
- Headings: Poppins Semibold (600)
- Body: Poppins Regular (400)
- Fallback to Arial for email clients without web font support

### Gmail SMTP Configuration

**Environment Variables:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@thegraph.foundation
SMTP_PASSWORD=<app-specific-password>
SMTP_FROM="The Graph Dashboards <info@thegraph.org>"
SMTP_USE_TLS=true
```

**App Password Setup:**
1. Enable 2FA on the Google account
2. Go to Security → App passwords
3. Generate new app password (name: "REO Dashboard Auth")
4. Use the 16-character password in `SMTP_PASSWORD`

## Docker Configuration

### New Service: auth-gate

```yaml
auth-gate:
  image: ghcr.io/graphprotocol/reo-auth-gate:latest
  container_name: reo-auth-gate
  restart: unless-stopped
  environment:
    - SMTP_HOST=${SMTP_HOST}
    - SMTP_PORT=${SMTP_PORT}
    - SMTP_USER=${SMTP_USER}
    - SMTP_PASSWORD=${SMTP_PASSWORD}
    - SMTP_FROM=${SMTP_FROM}
    - SESSION_SECRET=${SESSION_SECRET}
  volumes:
    - ./config/allowed_emails.txt:/app/config/allowed_emails.txt:ro
    - ./infrastructure/auth/grt_logo.png:/app/templates/grt_logo.png:ro
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
  networks:
    - dashboards-network
```

### Nginx Configuration Changes

```nginx
# Upstream for auth-gate service
upstream auth-gate {
    server auth-gate:8000;
}

# Internal auth endpoint for nginx auth_request
location = /auth-proxy {
    internal;
    proxy_pass http://auth-gate/validate;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header Cookie $http_cookie;
}

# REO API endpoints for OTP flow
location /reo/api/ {
    proxy_pass http://auth-gate/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# REO login page
location /reo/login {
    alias /usr/share/nginx/html/reo-login;
    try_files $uri $uri/ /reo/login/index.html;
}

# REO dashboard (protected)
location /reo {
    auth_request /auth-proxy;
    auth_request_set $user_status $upstream_status;

    # Redirect to login if auth fails
    error_page 401 = @reo_login_redirect;
    error_page 403 = @reo_login_redirect;

    alias /usr/share/nginx/html/reo;
    try_files $uri $uri/ /reo/index.html;
}

location @reo_login_redirect {
    return 302 /reo/login;
}
```

## File Structure

```
dashboard-infrastructure/
├── docker-compose.yml          # Add auth-gate service
├── config/
│   └── allowed_emails.txt      # Email whitelist
├── infrastructure/
│   ├── nginx/
│   │   ├── nginx.conf          # Update with auth configuration
│   │   └── reo-login/
│   │       └── index.html      # Login page
│   └── auth/
│       ├── Dockerfile          # Auth service image
│       ├── grt_logo.png        # Logo for emails
│       ├── main.py             # FastAPI application
│       └── templates/
│           └── email.html      # Email template
└── reo-auth-service/           # New repository for auth service
    ├── main.py
    ├── models.py               # Pydantic models
    ├── email.py                # Email sending logic
    ├── auth.py                 # Session management
    ├── whitelist.py            # Email whitelist validation
    ├── requirements.txt
    └── Dockerfile
```

## Technology Stack

- **Framework:** FastAPI (Python 3.11+)
- **Email:** Python smtplib with Gmail SMTP
- **Validation:** Pydantic v2
- **HTTP:** uvicorn server
- **Container:** Docker (Alpine base)
- **Reverse Proxy:** nginx with auth_request module

## Implementation Notes

### Why FastAPI?

- **Type hints** make code intent explicit and easier for AI agents to understand
- **Auto-generated OpenAPI docs** at `/docs` - AI can "see" the API structure
- **Pydantic models** make data validation explicit and testable
- **Modern async patterns** - more efficient than Bottle/Flask
- **Large training data** - AI agents have more FastAPI examples

### Why nginx auth_request?

- Clean separation: auth service only validates, doesn't serve content
- Auth service stays lightweight and stateless for validation
- Nginx handles all static file serving
- Standard pattern with extensive documentation

## Success Criteria

1. Only `/reo` route requires authentication
2. Email whitelist supports exact emails and wildcards
3. OTP codes expire after 10 minutes
4. Sessions last 7 days
5. Rate limiting: 5 OTP requests per hour per email
6. Emails use The Graph branding (Poppins font)
7. Auth service is containerized and scales independently
8. Nginx serves login page directly (no auth required)
9. Auth service has health check endpoint
10. All configuration via environment variables

## Future Enhancements (Out of Scope)

- Persistent session storage (Redis)
- Multi-factor authentication (TOTP + email)
- Admin interface for whitelist management
- Audit logging
- Single sign-on (SSO) integration
- OAuth2 provider support
