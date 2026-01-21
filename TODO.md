# Dashboard Infrastructure - TODO List

This file tracks high-level tasks, improvements, and known issues for the dashboard infrastructure project.

## Priority Tasks

### 🔴 High Priority

- [ ] **Fix SSL/HTTPS Setup**
  - Current state: Using Cloudflare Flexible SSL (HTTP to origin)
  - Options:
    - A) Complete nginx SSL termination with Let's Encrypt/certbot
    - B) Remove certbot entirely and rely solely on Cloudflare
  - Decision needed: Choose approach A or B

- [ ] **Install Playwright E2E Test Dependencies** ⚠️ REQUIRES SUDO
  - Missing libraries: `libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2`
  - Install command:
    ```bash
    sudo apt-get update && sudo apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
    ```
  - After install, run: `npm test` to verify E2E tests work

### 🟡 Medium Priority

- [ ] **Grumpy Goose Notion Votes**
  - Currently fetching and storing 1 Notion vote (Santiago)
  - Adam Fuller vote not being matched - fuzzy matcher needs update
  - Add "Adam Fuller" to council member name mappings

- [ ] **Docker Compose Version Warning**
  - Remove obsolete `version: '3.8'` from docker-compose.yml files
  - Warning appears on every deploy

- [ ] **Container Health Checks**
  - `dashboards-nginx` showing as unhealthy
  - `grumpygoose-scheduler-prod` showing as unhealthy
  - Fix health check endpoints or configurations

### 🟢 Low Priority

- [ ] **Rename "grumpygoose" to "goose"**
  - Update all references in:
    - Docker container names
    - Volume names
    - Documentation
    - Scripts

- [ ] **Monitoring & Observability**
  - Add container metrics collection
  - Set up log aggregation
  - Add uptime monitoring for dashboards

- [ ] **Documentation**
  - Update CLAUDE.md with SSL setup decision
  - Document deployment procedures
  - Add runbooks for common issues

## Recently Completed (2025-01-20)

- ✅ Complete REO styling overhaul to match The Graph brand guidelines
  - Part 1: Gradient background, white container, purple header, updated badges
  - Part 2: Removed breadcrumb, added "Back to Hub" link
  - Part 3: Fixed broken GRT logo (replaced with 🏆 emoji)
  - Part 4: Light theme for tables and footer (purple gradient headers, purple accents throughout)
- ✅ Restarted REO with updated env var
- ✅ Fixed routing - Goose served at `/goose` instead of root
- ✅ Created E2E testing policy in TESTING.md
- ✅ Fixed hub footer text: "community" → "Foundation"
- ✅ Diagnosed REO Graph API issue (was code bug, not API key)
- ✅ Added SQLite database module to REO
- ✅ Fixed REO to read from database instead of non-existent indexers.txt

## Known Issues

### REO Dashboard
- Database module created and working in production
- Scheduler restarting frequently (needs investigation)

### Grumpy Goose
- Notion vote matching incomplete (Adam Fuller not matched)
- Scheduler unhealthy status (needs investigation)

### SSL/HTTPS
- Let's Encrypt certificates not being renewed (certbot not configured)
- Currently relying on Cloudflare Flexible SSL only

## Technical Debt

### Code Quality
- REO generate_dashboard.py is 2700+ lines - needs refactoring
- Multiple JSON file operations mixed with new database code
- Inconsistent error handling across modules

### Architecture
- No shared database between Goose and REO (separate SQLite files)
- No centralized logging
- No monitoring/alerting setup

### Deployment
- Manual deployment process (no CI/CD for infrastructure)
- No blue-green deployment capability
- No automated rollback mechanism

## Future Improvements

### Performance
- Add Redis caching for subgraph queries
- Implement query result caching
- Optimize database queries

### Features
- Add historical data tracking for REO eligibility changes
- Implement alerting for eligibility status changes
- Add more comprehensive E2E test coverage

### Security
- Add API rate limiting
- Implement CORS policies
- Add security headers for all dashboards
- Regular dependency updates

---

**Last Updated:** 2026-01-20
**Maintained By:** Claude Code agents (see CLAUDE.md)
