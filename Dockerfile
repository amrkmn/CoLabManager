# Use the official Bun image as the base image
FROM oven/bun:alpine AS base

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and bun.lockb to install dependencies
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy the Prisma schema if it exists
COPY prisma ./prisma/

# Generate Prisma client.  This is crucial for production.
RUN bunx prisma generate

# Copy the rest of the application code
COPY . .

# Build the SvelteKit application for production
RUN bun run build

# --- Production Stage ---
# Use a minimal Node.js image for the production stage
FROM oven/bun:alpine AS prod

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=base /app/build ./build
COPY --from=base /app/node_modules/ ./node_modules/
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma/

#  Ensure that NODE_ENV is production
ENV NODE_ENV=production

# Generate Prisma Client (again, in the production stage)
RUN bunx prisma generate

# Expose the port your SvelteKit app runs on (default: 3000)
EXPOSE 3000

# Set the command to start the SvelteKit server in production mode
CMD ["bun", "run", "start"]
