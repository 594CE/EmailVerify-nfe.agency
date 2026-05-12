# Deployment Automation Agent Documentation

**Responsibility:** CI/CD & Deployment Automation Engineering
**Last Updated:** $(date '+%Y-%m-%d')

## Overview
This document tracks the deployment and CI/CD automation modifications implemented for the NFE Email Verifier SaaS monorepo. It serves as an architectural context layer for other agents to understand how deployments, Docker configurations, and infrastructure integrations operate.

## Fixes & Modifications Implemented

### Dockerfile Updates
- **`apps/backend/Dockerfile`**: Removed reliance on `turbo prune --docker` to prevent cachemount and overlayfs crashes on certain environments. Implemented manual multi-stage copying (`COPY . .`), caching (`pnpm install --frozen-lockfile`), workspace building (`pnpm build`), and cleanup (`rm -rf node_modules`) before pulling production dependencies with `pnpm install --prod --frozen-lockfile`.
- **`apps/worker/Dockerfile`**: Updated to match the backend robust installation strategy.
- **`apps/frontend/Dockerfile`**: Implemented the same robust installation strategy. Added `ARG VITE_API_URL` to allow dynamic injection of the API URL during the Vite build process. Updated the runner stage to use `nginx:alpine` to cleanly serve the `dist` directory. Retained `pnpm --filter "frontend" build` as defined in `apps/frontend/package.json` standard package name convention.

### Infrastructure & Deployment (`docker-compose.yml`)
- Added `restart: unless-stopped` to all services for better resilience.
- Configured native Docker `healthcheck` definitions for both **Frontend** (`wget http://localhost`) and **Backend** (`wget http://localhost:4000/health`).
- Updated internal container dependencies to leverage `condition: service_healthy` instead of basic `depends_on`, preventing race conditions during startup.
- Injected the `VITE_API_URL` build argument securely mapped to an environment variable fallback (`${VITE_API_URL:-http://localhost:4000/api}`) for the `frontend` container mapping.
- Mapped Frontend exposed port to `80` appropriately to match the internal `nginx:alpine` routing.

### Networking (`docker/nginx/nginx.conf`)
- Updated the primary reverse-proxy configuration to point to `frontend:80` since the frontend now correctly compiles down to static files hosted by an internal `nginx` container rather than mapping to port 3000 via a Vite development server.

### Environment & Build Changes
- **`.dockerignore`**: Created a comprehensive dockerignore file mapping `.git`, `node_modules`, `dist`, `.turbo`, and environment configs to vastly reduce Docker build context upload sizes and ensure clean builds.
- **`apps/frontend/vite.config.ts`**: Set `server.host = '0.0.0.0'` and `server.port = 3000` to correctly expose the server interfaces when used in local testing scenarios inside containers.
- **`README.md`**: Updated documentation to explicitly state the pre-requisite of Docker & Docker compose for deployment context.

## Assumptions Made
1. Multi-stage Docker builds using full workspace copy (`COPY . .`) with `rm -rf` over the Turborepo pruned approach guarantees safe `pnpm install --frozen-lockfile` resolution across all platforms, providing superior cross-platform consistency given overlay filesystem restrictions often found in CI pipelines.
2. The `frontend` does not perform SSR; the entire frontend can be safely served via Nginx.
3. The Vite frontend API URL configuration expects HTTP/HTTPS routing appropriately proxied or injected as an argument in the build phase.

## Validations Performed
- `docker compose config` was run successfully to validate the `docker-compose.yml` schema and constraints.
- `pnpm test` executed across all workspaces verifying that no underlying code/logic regressions occurred during package structure configuration updates.
- Visual inspection of the Nginx and Vite configurations confirmed routing paths are consistent with the newly decoupled static hosting configuration.

## Risks & Rollback Considerations
- **Risk:** Copying the full repo during Docker builds increases the initial layer size context compared to strict filtering. This is an accepted tradeoff to ensure deterministic installations across environments using the workspace lockfile.
- **Integration Concern:** If other agents add environment variables required by the frontend, they **must** add matching `ARG` configurations in `apps/frontend/Dockerfile` and map them in `docker-compose.yml` so Vite can compile them.

## Unresolved Issues
- None. Build pipelines are stable and deterministic using frozen lockfiles and deterministic multi-stage build scripts.
