# -------- Build Stage --------
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack and use Yarn v4
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Copy necessary files for install
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install all dependencies
RUN yarn install --immutable

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN yarn prisma generate

# Copy the rest of the app
COPY . .

# Build the app
RUN yarn build

# -------- Production Dependencies Stage --------
FROM node:22-alpine AS deps

WORKDIR /app

# Enable corepack and use Yarn v4
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install production dependencies only
RUN yarn workspaces focus --production && yarn cache clean

# -------- Production Stage --------
FROM node:22-alpine AS prod

# Create non-root user for security
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

# Copy production dependencies only
COPY --from=deps /app/node_modules ./node_modules

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["node", "build/index.js"]