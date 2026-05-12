# Frontend Infrastructure Engineer Agent

This file serves as the documentation and coordination layer for the Frontend Infrastructure and Deployment engineering agent.

## Fixes Implemented
* Fixed a misconfigured package name in `apps/frontend/package.json` from `frontend` to `@nfe/frontend` to ensure it matches the pnpm workspace scope filter used in `apps/frontend/Dockerfile`.
* Added `ARG VITE_API_URL` and `ENV VITE_API_URL=$VITE_API_URL` to the `apps/frontend/Dockerfile` to allow passing the API URL during the build phase, as Vite natively embeds these values at build time statically.
* Configured a custom `nginx.conf` (`apps/frontend/nginx.conf`) with `try_files $uri $uri/ /index.html;` to ensure proper routing for the React Single Page Application (SPA).
* Removed development-oriented volume bind mounts (`- ./apps/frontend:/app/apps/frontend`, `- ./packages:/app/packages`) from the `frontend` service in `docker-compose.yml`. This prevents the static production Nginx server from being overwritten by the local, unbuilt source code.
* Realigned port mappings and reverse proxy configurations:
  * Removed port mapping (`3000:3000`) for the `frontend` service in `docker-compose.yml` to prevent port exposure conflicts since traffic routes through the main `nginx` reverse proxy.
  * Updated the upstream frontend connection in `docker/nginx/nginx.conf` to target `frontend:80` (previously `frontend:3000`) because the frontend container uses the default Nginx port.
* Set `server` and `preview` host configuration in `apps/frontend/vite.config.ts` to natively listen to `0.0.0.0` when running in Docker or cloud VPS instances during development.
* Standardized base URLs in API and WebSocket logic (`apps/frontend/src/utils/api.ts` and `apps/frontend/src/utils/socket.ts`) to use relative paths (`/api` and `/`), improving reverse proxy compatibility over the previously hard-coded `localhost:4000`.
* Refactored typing in frontend React components (`DashboardHome.tsx`, `Login.tsx`, `Team.tsx`, `BulkUpload.tsx`) to conform with ESLint and TypeScript compilation requirements without relying implicitly on `any` types.

## Files Modified
* `apps/frontend/package.json`
* `apps/frontend/Dockerfile`
* `apps/frontend/nginx.conf` (New)
* `apps/frontend/vite.config.ts`
* `docker-compose.yml`
* `docker/nginx/nginx.conf`
* `apps/frontend/src/utils/api.ts`
* `apps/frontend/src/utils/socket.ts`
* `apps/frontend/src/pages/DashboardHome.tsx`
* `apps/frontend/src/pages/Login.tsx`
* `apps/frontend/src/pages/billing/Billing.tsx`
* `apps/frontend/src/pages/bulk/BulkUpload.tsx`
* `apps/frontend/src/pages/team/Team.tsx`

## Infrastructure Changes
* **Docker Compose Structure**: The `frontend` container is now treated as a production-grade multi-stage container executing static compilation on start up and hosting through an internal Nginx on port `80`.
* **API Configuration:** Environment variables via `.env` files must provide `FRONTEND_VITE_API_URL` to pass parameters into the Dockerfile at build-time.

## Validations Performed
* Local execution of `pnpm install`.
* Compilation tests targeting `@nfe/frontend` leveraging the new `package.json` namespace schema: `pnpm run build --filter "@nfe/frontend"`.
* Strict linter validations via `eslint` configured with TypeScript checking: `pnpm run lint --filter "@nfe/frontend"`.
* Code review validating Docker, Proxy, and monorepo configurations.

## Compatibility Considerations
* Reverse proxy configuration expects requests from `/api` to correctly pass into the backend. Other routing requests pass to the frontend SPA Nginx container.

## Unresolved Issues / Risks
* No major unresolved issues detected. Ensure `.env` settings map `FRONTEND_VITE_API_URL` securely into the build pipeline in target VPS deployments.

## Rollback Considerations
* If unexpected production issues surface during frontend loading, rolling back `docker-compose.yml` to the prior state or reinstating the `3000:3000` port bindings will temporarily revert the container to run a Vite dev server (via manual `npm run dev` override), though this is inherently unstable in a production environment.

## Integration Concerns for Other Agents
* **Backend Developers:** Please ensure any additional API paths are routed correctly through the main `docker/nginx/nginx.conf` and consider relative path handling standard.
* **DevOps/Deployment:** Maintain explicit definition of `FRONTEND_VITE_API_URL` in CI/CD pipeline variables when invoking `docker compose build`.