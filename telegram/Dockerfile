# Multi-stage Dockerfile for Clair Telegram Bot
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S telegram -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=build --chown=telegram:nodejs /app/dist ./dist
COPY --from=build --chown=telegram:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=telegram:nodejs /app/package.json ./package.json

# Create logs directory
RUN mkdir -p /app/logs && chown telegram:nodejs /app/logs

# Switch to non-root user
USER telegram

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]