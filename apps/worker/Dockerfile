FROM node:18-alpine AS base

RUN npm install -g pnpm@10.30.3
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@nfe/shared" build
RUN pnpm --filter "@nfe/config" build
RUN pnpm --filter "@nfe/database" build
RUN pnpm --filter "@nfe/core" build
RUN pnpm --filter "@nfe/worker" build
RUN rm -rf node_modules apps/worker/node_modules packages/*/node_modules
RUN pnpm install --prod --frozen-lockfile

FROM node:18-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/worker ./apps/worker
ENV NODE_ENV=production
CMD ["node", "apps/worker/dist/index.js"]
