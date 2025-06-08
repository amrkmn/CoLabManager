# -------- Build Stage --------
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy only necessary files for dependency installation
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --frozen-lockfile

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN bunx prisma generate

# Copy the rest of the source code
COPY . .

# Build the app
RUN bun run build

# -------- Production Stage --------
FROM oven/bun:alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

# Copy build output and minimal runtime dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Re-generate Prisma client in case the target image is architecture-dependent
RUN bunx prisma generate

EXPOSE 3000

CMD ["bun", "run", "start"]
