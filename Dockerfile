# -------- Build Stage --------
FROM node:22-alpine AS builder

WORKDIR /app

# Install Bun
RUN apk add --no-cache curl && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Copy only necessary files for dependency installation
COPY package.json bun.lock ./

# Install only production dependencies using Bun
RUN bun install --frozen-lockfile

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN bunx prisma generate

# Copy the rest of the source code
COPY . .

# Build the app
RUN bun run build

# -------- Production Stage --------
FROM node:22-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

# Copy build output and minimal runtime dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Install Bun in production image for bunx prisma generate (optional, can be removed if not needed)
RUN apk add --no-cache curl && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Re-generate Prisma client in case the target image is architecture-dependent
RUN bunx prisma generate

EXPOSE 3000

CMD ["node", "build/index.js"]