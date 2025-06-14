# -------- Build Stage --------
FROM oven/bun:alpine AS builder

WORKDIR /app

# Install git (needed for some dependencies)
RUN apk add --no-cache git

# Copy only necessary files for dependency installation
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN bunx prisma generate

# Copy the rest of the source code
COPY . .

# Build the app
RUN bun run build

# -------- Production Stage --------
FROM oven/bun:alpine AS production

WORKDIR /app

# Add labels for better container metadata
LABEL org.opencontainers.image.title="CoLab Manager"
LABEL org.opencontainers.image.description="Collaborative Project Management Application"
LABEL org.opencontainers.image.vendor="CoLab Manager"
LABEL org.opencontainers.image.licenses="BSD 2-Clause"

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bun -u 1001

ENV NODE_ENV=production
ENV PORT=3000

# Copy build output and minimal runtime dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Re-generate Prisma client for the target architecture
RUN bunx prisma generate

# Switch to non-root user
USER bun

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun --version || exit 1

CMD ["bun", "run", "start"]
