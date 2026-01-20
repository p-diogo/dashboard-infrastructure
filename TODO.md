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

- [ ] **Playwright E2E Test System Dependencies**
  - Playwright requires system libraries: libnspr4, libnss3, libatk, etc.
  - Need to either:
    - Install system dependencies on server
    - Use Docker-based Playwright testing
    - Find alternative E2E testing approach

- [ ] **Production Deploy REO with SQLite**
  - Database module added, needs testing in production
  - Verify data persistence across container restarts
  - Monitor for any performance issues

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

- ✅ Fixed routing - Goose served at `/goose` instead of root
- ✅ Created E2E testing policy in TESTING.md
- ✅ Fixed hub footer text: "community" → "Foundation"
- ✅ Diagnosed REO Graph API issue (was code bug, not API key)
- ✅ Added SQLite database module to REO
- ✅ Fixed REO to read from database instead of non-existent indexers.txt

## Known Issues

### REO Dashboard
- Database module created but not yet tested in production
- Scheduler restarting frequently (needs investigation)
- 403 error when accessing /reo/ (should be fixed after database refactor)

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

**Last Updated:** 2025-01-20
**Maintained By:** Claude Code agents (see CLAUDE.md)
