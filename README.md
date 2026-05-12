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
3. The `apps/worker` picks up the job, streaming the CSV locally and dividing it into 500-row chunks to keep memory usage low and distribute load safely.
4. Each email goes through the `@nfe/core` Verification Engine.
5. The worker updates the `BulkJob` progress in DB and simultaneously emits a `redisPublisher.publish('bulk-progress')` event.
6. The `apps/backend` (which acts as a WebSocket server) listens to Redis pub/sub channels and relays the progress directly to the user's specific Socket.io room.
7. The frontend updates its UI instantly.

## Local Installation & Setup

If you want to run the project entirely on your local machine (without Docker), you'll need the following prerequisites installed:

### 1. Local Prerequisites

- **Node.js (18+)**: It is highly recommended to use `nvm` (Node Version Manager) to install and manage your Node version.
- **PNPM (v10+)**: Install via npm using `npm install -g pnpm`.
- **MongoDB**: Have a local MongoDB server running on port 27017, or grab a free connection string from MongoDB Atlas.
- **Redis**: Have a local Redis server running on port 6379.

### 2. Initialization

1. Clone the repository and install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment variables:

   ```bash
   cp .env.example .env
   ```

   _(Update the `.env` values like `JWT_SECRET`, `STRIPE_SECRET_KEY`, and `MONGO_URI` if necessary)._

3. Build the shared packages:

   ```bash
   pnpm run build
   ```

4. Start the development environment:
   ```bash
   pnpm dev
   ```
   _This starts the frontend on `http://localhost:3000`, the backend on `http://localhost:4000`, and spins up the background workers._

### 3. Creating Your First User

Because the database starts empty, there is no web-facing registration page (to protect your SaaS). Create your first admin user by running the following `curl` command in a new terminal tab:

```bash
curl -X POST http://localhost:4000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"email": "admin@example.com", "password": "password123", "name": "Admin User", "role": "admin"}'
```

You can now log in to the frontend at `http://localhost:3000/login` with those credentials.

## Cloud Deployment (AWS Lightsail / Docker)

The platform is designed to be easily deployed to a Virtual Private Server (VPS) like AWS Lightsail or DigitalOcean using Docker Compose.

### 1. VPS Requirements

- **OS:** Ubuntu 22.04 LTS
- **Hardware:** Minimum 2GB RAM / 2 vCPUs
- **Crucial Requirement:** You **MUST** request AWS to lift the "EC2 Port 25 restriction" for your instance's Elastic IP. Without outbound Port 25 unblocked, the SMTP validation engine will permanently timeout when verifying emails.

### 2. Deployment Steps

1. SSH into your VPS. Update packages and install Docker:

   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt-get install docker-compose-plugin -y
   sudo usermod -aG docker $USER
   ```

   _(Log out and back in for the group changes to take effect)._

2. Clone your repository:

   ```bash
   git clone <your-repo-url> emailverify-saas
   cd emailverify-saas
   ```

3. Setup environment variables:

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your real Stripe API keys and update `FRONTEND_URL` to match your real domain (e.g. `https://yourdomain.com`).

4. Boot the containers:
   ```bash
   docker compose up -d --build
   ```

The `docker-compose.yml` file will automatically spin up MongoDB, Redis, the Nginx reverse proxy (listening on port 80), the Node backend, the Worker, and the Frontend.

### 3. Scaling Workers

If your queue processing starts to lag, you can horizontally scale the background workers instantly without shutting down the application:

```bash
docker compose up -d --scale worker=3
```

All workers coordinate securely and lock-free utilizing BullMQ over Redis.
