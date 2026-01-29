# Volume Migration Guide

## Overview

This guide explains how to migrate Grumpy Goose production volumes from the old naming convention (`goose-*`) to the new convention (`goose-prod-*`).

## Why This Migration?

The new naming convention provides:
- **Consistency**: All environments follow the pattern `goose-{env}-*`
- **Clarity**: Easy to distinguish between production, staging, and development volumes
- **Safety**: Reduces risk of using wrong volumes in different environments

## Volume Mapping

| Old Volume Name | New Volume Name | Purpose |
|----------------|-----------------|---------|
| `goose-output` | `goose-prod-output` | Generated HTML files |
| `goose-data` | `goose-prod-data` | SQLite database |

## Migration Steps

### 1. Backup Current Data

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Create backup directory
mkdir -p backups
cd backups

# Backup goose-data (database)
docker run --rm \
  -v goose-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/goose-data-$(date +%Y%m%d-%H%M%S).tar.gz /data

# Backup goose-output (HTML files)
docker run --rm \
  -v goose-output:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/goose-output-$(date +%Y%m%d-%H%M%S).tar.gz /data

# List backups
ls -lh
```

### 2. Stop All Services

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Stop all grumpygoose services
docker compose stop grumpygoose grumpygoose-scheduler
```

### 3. Create New Volumes

```bash
# Create new production volumes
docker volume create goose-prod-data
docker volume create goose-prod-output

# Verify volumes created
docker volume ls | grep goose-prod
```

### 4. Migrate Data

```bash
# Migrate database
docker run --rm \
  -v goose-data:/from \
  -v goose-prod-data:/to \
  alpine sh -c "cp -a /from/. /to/"

# Migrate HTML output
docker run --rm \
  -v goose-output:/from \
  -v goose-prod-output:/to \
  alpine sh -c "cp -a /from/. /to/"

# Verify migration
docker run --rm \
  -v goose-prod-data:/data \
  alpine ls -la /data

docker run --rm \
  -v goose-prod-output:/data \
  alpine ls -la /data
```

### 5. Update Docker Compose Configuration

The `docker-compose.yml` file has already been updated to use the new volume names. Verify the changes:

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Check that production services use new volumes
grep -A 5 "grumpygoose:" docker-compose.yml | grep volume
# Should show: goose-prod-output and goose-prod-data
```

### 6. Start Services with New Volumes

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Remove old containers (they will be recreated with new config)
docker compose rm -f grumpygoose grumpygoose-scheduler

# Start services
docker compose up -d grumpygoose grumpygoose-scheduler

# Verify services are running
docker ps | grep grumpygoose

# Check logs
docker logs grumpygoose-scheduler-prod
```

### 7. Verify Deployment

```bash
# Check production URL
curl -I https://hub.thegraph.foundation/goose

# Should return 200 OK and show fresh data
```

## Rollback (If Needed)

If something goes wrong, you can rollback to the old volumes:

```bash
# Stop services
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure
docker compose stop grumpygoose grumpygoose-scheduler

# Restore old volume references in docker-compose.yml
# (git checkout to revert changes)

# Restart services with old volumes
docker compose up -d grumpygoose grumpygoose-scheduler
```

## Cleanup (After Verification)

Once everything is working correctly, you can remove the old volumes:

```bash
# WARNING: Only do this after verifying the migration is successful!
# Wait at least 24 hours and confirm production is working correctly.

# List old volumes
docker volume ls | grep "^local     goose-"

# Remove old volumes (uncomment after verification)
# docker volume rm goose-output goose-data
```

## Staging Setup

After completing the production migration, set up staging:

```bash
cd /home/pdiogo/hosted-apps/repos/dashboard-infrastructure

# Start staging services
docker compose up -d grumpygoose-staging grumpygoose-scheduler-staging

# Verify staging
curl -I https://staging.hub.thegraph.foundation
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker logs grumpygoose-scheduler-prod
docker logs grumpygoose-prod

# Check volume permissions
docker run --rm -v goose-prod-data:/data alpine ls -la /data
```

### Data Not Showing Up

```bash
# Verify scheduler is writing to correct volume
docker exec grumpygoose-scheduler-prod ls -la /app/output

# Check if HTML files exist
docker run --rm -v goose-prod-output:/data alpine ls -la /data
```

### Wrong Volume Being Used

```bash
# Check which volumes containers are using
docker inspect grumpygoose-scheduler-prod | grep -A 10 Mounts
```

## Quick Reference

| Environment | URL | Volumes | Services |
|-------------|-----|---------|----------|
| **Production** | hub.thegraph.foundation/goose | goose-prod-* | grumpygoose-prod, grumpygoose-scheduler-prod |
| **Staging** | staging.hub.thegraph.foundation | goose-staging-* | grumpygoose-staging, grumpygoose-scheduler-staging |

## Support

If you encounter issues during migration:
1. Check logs: `docker compose logs -f grumpygoose-scheduler`
2. Verify volumes: `docker volume ls | grep goose`
3. Restore from backup if needed
4. Check rollback steps above
