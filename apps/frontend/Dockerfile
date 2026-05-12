FROM node:18-alpine AS base
RUN npm install -g pnpm@10.30.3
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/
RUN pnpm install
RUN pnpm --filter "@nfe/shared" build
RUN pnpm --filter "@nfe/frontend" build

FROM nginx:alpine
COPY --from=base /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
