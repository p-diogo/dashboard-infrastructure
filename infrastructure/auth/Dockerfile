# Dockerfile for REO Auth Gate Service
FROM python:3.11-alpine

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates

# Copy requirements first for better caching
COPY infrastructure/auth/requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY infrastructure/auth/*.py /app/

# Copy templates and config directory structure
COPY infrastructure/auth/templates/ /app/templates/

# Create config directory for whitelist
RUN mkdir -p /app/config

# Create non-root user for security
RUN addgroup -g 1000 auth && \
    adduser -D -u 1000 -G auth auth && \
    chown -R auth:auth /app

# Switch to non-root user
USER auth

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
