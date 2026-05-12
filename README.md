# NFE Email Verifier SaaS

A production-grade, highly scalable Email Verification SaaS platform designed to accurately validate emails and handle bulk CSV verifications via a distributed queue system.

## Architecture

This project is structured as a **Turborepo Monorepo** with strict package boundaries for scalability, independent builds, and long-term maintainability.

### Apps

- **`apps/frontend`**: React, Vite, Tailwind CSS, Zustand, React Query. Supports Single Verification, Drag-and-Drop Bulk CSV Uploads, Billing, and Live Dashboard Analytics. Includes real-time progress bars powered by Socket.io.
- **`apps/backend`**: Node.js, Express, TypeScript. Provides REST APIs for auth, team management, billing webhooks (Stripe), and validation trigger endpoints. Handles JWT, Rate Limiting, and WebSocket connections.
- **`apps/worker`**: BullMQ-based background worker. Connects to Redis and MongoDB to pull bulk CSV verification jobs off the queue. Processes emails through the `@nfe/core` Verification Engine and publishes progress events via Redis pub/sub.

### Packages

- **`@nfe/core`**: The standalone Email Verification Engine. Contains modules for `SyntaxValidator`, `DisposableDetector`, `DNSChecker` (with MX caching), `SMTPVerifier` (with Catch-All and Greylist handling), and `ScoringEngine`.
- **`@nfe/database`**: Centralized MongoDB connection logic and Mongoose Models (`User`, `Team`, `VerificationLog`, `BulkJob`).
- **`@nfe/config`**: Shared configuration encompassing the `pino` logger, `ioredis` instances, Stripe, and BullMQ queue definitions.
- **`@nfe/shared`**: Reusable TypeScript definitions, interfaces, and utilities.

## Flow of a Bulk Verification

1. A user uploads a CSV in the frontend (`apps/frontend`).
2. The `apps/backend` receives the file via Multer, initializes a `BulkJob` in `@nfe/database`, and adds a message to the `bulkVerificationQueue` (BullMQ).
3. The `apps/worker` picks up the job, streaming the CSV locally to keep memory usage low.
4. Each email goes through the `@nfe/core` Verification Engine.
5. The worker updates the `BulkJob` progress in DB and simultaneously emits a `redisPublisher.publish('bulk-progress')` event.
6. The `apps/backend` (which acts as a WebSocket server) listens to Redis pub/sub channels and relays the progress directly to the user's specific Socket.io room.
7. The frontend updates its UI instantly.

## Pre-Requisites

- Node.js 18+
- pnpm v10+
- MongoDB
- Redis Server

## Setup & Running Locally

1. Install dependencies across the monorepo:

   ```bash
   pnpm install
   ```

2. Copy the example environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start all packages in parallel using Turborepo:
   ```bash
   pnpm dev
   ```

_(Alternatively, you can run the full environment via `docker-compose up --build -d` which spins up MongoDB, Redis, Nginx, Frontend, Backend, and Workers)._

## Deploying

This monorepo is Docker-ready. Look at the `Dockerfile`s in each `apps/*` directory. The Dockerfiles utilize Turborepo's filtering to prune and install only what's necessary per-app, significantly reducing image sizes.

For scaling, you simply increase the number of worker containers:

```bash
docker-compose up --scale worker=5 -d
```

All workers coordinate lock-free utilizing BullMQ via Redis.
