# -------- Build Stage --------
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies with Bun (faster)
RUN bun install --frozen-lockfile

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN bun run prisma generate

# Copy the rest of the app
COPY . .

# Build the app (still works with Bun)
RUN bun run build

# -------- Production Dependencies Stage --------
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install only production dependencies
RUN bun install --frozen-lockfile --production

# -------- Production Stage --------
FROM node:22-alpine AS prod

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json

# Copy Prisma schema (needed for migrations and client runtime)
COPY --from=builder /app/prisma ./prisma/

# Copy production dependencies + Prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Run with Node.js (not Bun)
CMD ["node", "build/index.js"]