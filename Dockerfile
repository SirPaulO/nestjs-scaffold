# Multi-stage build for NestJS application

# Development stage
FROM node:24-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Mount the token from the host environment safely into npm's configuration
RUN --mount=type=secret,id=NPM_TOKEN \
    # 1. Point your scope at the GitHub Packages npm registry
    npm config set @tavolai:registry https://npm.pkg.github.com && \
    # 2. Set the auth token for that registry
    npm config set "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NPM_TOKEN)" && \
    # 3. Install
    npm i && \
    # 4. Remove the token from .npmrc within this layer
    npm config delete //npm.pkg.github.com/:_authToken

# Copy source code
COPY . .

# Start development server with hot-reload
CMD ["npm", "run", "start:dev"]

# Build stage
FROM node:24-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Mount the token from the host environment safely into npm's configuration
RUN --mount=type=secret,id=NPM_TOKEN \
    # 1. Point your scope at the GitHub Packages npm registry
    npm config set @tavolai:registry https://npm.pkg.github.com && \
    # 2. Set the auth token for that registry
    npm config set "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NPM_TOKEN)" && \
    # 3. Install
    npm i && \
    # 4. Remove the token from .npmrc within this layer
    npm config delete //npm.pkg.github.com/:_authToken

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy built application and dependencies from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Start the application
CMD ["node", "dist/main"]
