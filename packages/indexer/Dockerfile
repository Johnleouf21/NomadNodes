# Dockerfile for Ponder indexer on Railway
FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy application files
COPY . .

# Generate Ponder types
RUN pnpm codegen

# Expose Ponder's default port
EXPOSE 42069

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:42069/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start Ponder in production mode
CMD ["pnpm", "start"]
