FROM node:18-alpine AS base

# Accept build arguments
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm install -g pnpm@10.30.3
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@nfe/shared" build
RUN pnpm --filter "frontend" build

FROM nginx:alpine
COPY --from=base /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
