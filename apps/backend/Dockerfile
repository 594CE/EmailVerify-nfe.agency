FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.30.3

WORKDIR /app

# Copy root package.json and workspace definition
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy packages and backend app
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared and backend
RUN pnpm --filter "@nfe/shared" build
RUN pnpm --filter "@nfe/config" build
RUN pnpm --filter "@nfe/database" build
RUN pnpm --filter "@nfe/core" build
RUN pnpm --filter "@nfe/backend" build

# Prune dev dependencies
RUN pnpm install --prod

# Production image
FROM node:18-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/backend ./apps/backend

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "apps/backend/dist/index.js"]
