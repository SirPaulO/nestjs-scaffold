# Multi-stage build for the NestJS application.

# Development stage
FROM node:24-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "start:dev"]

# Build stage
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Drop devDependencies so only production deps ship to the runtime image.
RUN npm prune --omit=dev

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "dist/main"]
