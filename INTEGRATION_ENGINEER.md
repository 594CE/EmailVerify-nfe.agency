# Integration Engineering Documentation

**Agent Responsibility:** Systems Integration, Architecture Validation, and Conflict Resolution Engineer

This document tracks all system-level architecture changes, integration fixes, and deployment modifications to ensure consistency and stability across the monorepo ecosystem.

## Changes Implemented (Latest)

### Fixes Implemented
- **Monorepo Convention Fix:** Renamed the frontend package to `@nfe/frontend` to align with the rest of the workspace and fix Docker build target filtering.
- **Frontend SPA Routing:** Added a dedicated Nginx configuration for the frontend container to enable proper React Router client-side routing (fixing 404s on refresh).
- **Reverse Proxy Port Mapping:** Fixed the main Nginx reverse proxy `docker/nginx/nginx.conf` to target the frontend container on port `80` (production Nginx) instead of port `3000` (Vite dev server).
- **Cross-Service Networking:** Updated the frontend's API and Socket.io clients to use relative paths (`/api` and `/`). This allows the global reverse proxy to properly route traffic in a production environment, eliminating hardcoded `localhost` references that break deployed apps.
- **Environment Variable Interpolation:** Enhanced `docker-compose.yml` to properly inject critical secrets (`JWT_SECRET`, Stripe keys) and concurrency variables using `${VAR:-default}` interpolation for the backend and worker containers.

### Files Modified
- `apps/frontend/package.json` (Renamed to `@nfe/frontend`)
- `apps/frontend/Dockerfile` (Updated pnpm filter, added Nginx config copy)
- `apps/frontend/nginx.conf` (Created for SPA fallback routing)
- `apps/frontend/src/utils/api.ts` (Relative URL)
- `apps/frontend/src/utils/socket.ts` (Relative URL)
- `docker/nginx/nginx.conf` (Upstream port fixed to 80)
- `docker-compose.yml` (Added env interpolations, removed redundant port bindings)

### Infrastructure & Docker Changes
- **Docker Changes:** Frontend `Dockerfile` now builds with the correct workspace filter and includes the SPA routing Nginx config.
- **Deployment Changes:** Deployments now rely completely on the main reverse proxy passing traffic to frontend container Nginx on port 80.
- **Networking Changes:** Removed explicit `3000:3000` port mapping from `frontend` in `docker-compose.yml`. All external traffic must flow through the main `nginx` container on port 80.

### Environment Variable Changes
- Exposed interpolation for `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `WORKER_CONCURRENCY` in `docker-compose.yml`. Production instances must supply these at runtime.

### Runtime Changes
- Frontend client no longer attempts to hit `http://localhost:4000/api` directly, relying on the host domain's `/api` route.

## Validation & Considerations

### Validations Performed
- Verified monorepo package resolution and filter behavior using `pnpm`.
- Validated Nginx configuration syntax and routing logic.
- Tested `pnpm run test` suite to ensure no core regressions.

### Assumptions Made
- The main Nginx container acts as the sole entry point for HTTP traffic.
- Production deployments will execute `docker-compose up` supplying the actual `.env` file on the host machine.
- TLS/SSL termination will occur either on a load balancer (e.g., AWS ALB), via Cloudflare, or by extending the main Nginx configuration in production, as outlined in the deployment checklist.

### Compatibility Considerations
- If Vite Dev server (`pnpm dev`) is run natively outside Docker, it might run on port 5173 or 3000. For local dev, the `.env` `VITE_API_URL` should be explicitly set if the backend is not on the same origin.

### Integration Concerns for Other Agents
- **Do not hardcode localhost:** Other agents working on frontend/backend communication must use relative URLs (`/api/...`) or rely on dynamically injected variables.
- **Docker Overrides:** If testing locally with Docker Compose, any additions to `.env` must be explicitly mapped in the `environment:` section of `docker-compose.yml` if the containers require runtime access to them.
- **Monorepo Naming:** Any new apps/packages must strictly follow the `@nfe/<name>` package.json naming convention.

### Risks Introduced & Rollback Considerations
- **Risks:** The frontend relies on the exact path proxy logic in `docker/nginx/nginx.conf`. Any changes to the main reverse proxy must preserve the `Upgrade` headers for WebSocket connections (`/socket.io`) and proper proxying for `/api`.
- **Rollback:** Reverting `api.ts` and `socket.ts` to `localhost` will instantly break any deployed non-local instances. To rollback frontend routing, revert `apps/frontend/Dockerfile` and `docker/nginx/nginx.conf` in tandem.

### Unresolved Issues
- Build time vs. Runtime environments: Currently, Vite bundles environment variables at build time. For dynamic environments where the API URL might change without a rebuild, a runtime configuration fetch strategy may be needed in the future. Right now, relative paths mitigate this requirement.