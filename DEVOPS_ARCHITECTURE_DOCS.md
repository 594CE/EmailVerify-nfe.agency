# DevOps & System Automation Agent Documentation

This document serves as the persistent coordination and architecture state reference for the deployment pipeline, infrastructure, and monorepo configurations. It is actively maintained by the DevOps and Systems Automation engineering agent.

## Fixes Implemented

1. **Docker Compose Volume Fixes**: Removed local host volume mounts (`./apps/*` and `./packages/*`) from `docker-compose.yml` for `backend` and `worker` services. These were incorrectly placed in the production deployment configuration and were overwriting the built container files (`dist`) with local source files.
2. **Nginx Upstream Port Fix**: Corrected Nginx proxy routing to target `frontend:80` instead of `frontend:3000`. The frontend container uses an `nginx:alpine` image exposing port 80.
3. **Vite Build-Time Environment Variable Fix**: Moved `VITE_API_URL` injection from runtime docker-compose environments to `build.args` and `ARG` inside `apps/frontend/Dockerfile`. Vite requires variables at build time, and injecting them at runtime on a static container was silently failing.
4. **Turborepo Naming Correction**: Updated `apps/frontend/package.json` package name from `"frontend"` to `"@nfe/frontend"`. This ensures Turborepo commands and the `pnpm --filter "@nfe/frontend" build` command in the Dockerfile function correctly.
5. **Backend Healthchecks**: Added a standard `wget`-based healthcheck to the backend container configuration ensuring downstream services only execute once the API has initialized on port 4000.

## Files Modified

* `apps/frontend/package.json`
* `apps/frontend/Dockerfile`
* `docker/nginx/nginx.conf`
* `docker-compose.yml`

## Infrastructure & Runtime Changes

* Removed deprecated `version: '3.8'` from `docker-compose.yml`.
* Removed external port binding for the frontend (`3000:3000`) since traffic should strictly flow through the Nginx reverse proxy.
* Modified the Dockerfile build process for the frontend to accept `VITE_API_URL` and expose it to the `vite build` context.
* Services now rely on standard `wget` spider tests for healthchecks during automated deployment.

## Assumptions Made

* The frontend application is strictly static post-build and does not rely on SSR logic requiring Node.js runtime.
* Nginx proxy handles SSL termination externally (e.g. via Lightsail or Cloudflare) since the configuration strictly binds on 80.
* Redis and MongoDB are run as simple instances in containers; no clustered infrastructure is required in the short-term.

## Validations Performed

* Validated syntax and structural schema changes using `docker compose config`.
* Monorepo dependency maps were validated via successful execution of `pnpm install`, `pnpm build`, and `pnpm test`.

## Rollback Considerations

* Reverting `docker-compose.yml` modifications will re-introduce host mounts, breaking cloud deployment unless built locally.
* Reverting frontend build logic will break `VITE_API_URL` bindings causing broken API requests.

## Integration Concerns for Other Agents

* **Frontend Developers:** Do not rely on runtime `import.meta.env` for environment variable injection when modifying the Docker deployment process; Vite is configured for static builds.
* **Backend Developers:** A `/health` endpoint is heavily relied upon by the orchestrator. Modifying this endpoint in Express (`apps/backend/src/index.ts`) will break Docker compose start-up sequences.
* **Architecture Rules:** Ensure all cross-package imports use the `@nfe` namespace boundaries properly so Turborepo can appropriately cache and resolve dependencies.
