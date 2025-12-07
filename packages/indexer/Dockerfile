# Dockerfile for Ponder indexer on Railway
FROM node:24-slim

# Cache buster to force fresh build - increment this to rebuild
ENV CACHE_BUST=2025-12-05-v6-RATE-LIMIT-FIX

# Install pnpm (match version in root package.json)
RUN npm install -g pnpm@10.23.0

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Generate Ponder types
RUN pnpm codegen

# Expose Ponder's default port
EXPOSE 42069

# Start Ponder in production mode
CMD ["pnpm", "start"]
