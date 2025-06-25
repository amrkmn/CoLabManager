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


# -------- Production Stage --------
FROM node:22-alpine AS prod

WORKDIR /app
ENV NODE_ENV=production

# Copy built app and runtime deps
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "build/index.js"]
