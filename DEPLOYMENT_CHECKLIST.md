# Deployment Checklist (AWS Lightsail)

This guide walks you through preparing the `emailverify-saas` monorepo for production deployment via Docker Compose on an AWS Lightsail instance.

## 1. Instance Requirements

- **OS:** Ubuntu 22.04 LTS (Recommended)
- **Size:** At least 2GB RAM / 2 vCPUs ($10-$20/mo instance).
- **Network:** Assign a Static IP to your instance in the Lightsail Console.

## 2. Firewall Port Configuration

In the AWS Lightsail Networking tab for your instance, open the following IPv4 firewall rules:

- **Port 22 (SSH)**: For server access. (Limit to your own IP address if possible).
- **Port 80 (HTTP)**: For web traffic routed through Nginx.
- **Port 443 (HTTPS)**: For SSL/TLS traffic (once configured).

> **CRITICAL - PORT 25 (SMTP):** AWS blocks _outbound_ Port 25 by default to prevent spam. Our verification engine needs outbound Port 25 to test remote MX servers. You must submit a request to AWS support to lift the "EC2 Port 25 restriction" for your Elastic/Static IP, or your worker will permanently hang/timeout when verifying emails.

## 3. Server Setup

SSH into your Lightsail instance and run the following:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin (if not included)
sudo apt-get install docker-compose-plugin -y

# Add your ubuntu user to docker group
sudo usermod -aG docker $USER
```

_Log out and log back in for the group changes to take effect._

## 4. Deploying the Application

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url> emailverify-saas
   cd emailverify-saas
   ```

2. **Configure Environment Variables:**

   ```bash
   cp .env.example .env
   ```

   _Edit `.env` and fill in your real `JWT_SECRET`, `STRIPE_SECRET_KEY`, and set `FRONTEND_URL` to your production domain (e.g., `https://yourdomain.com`)._

3. **Start the containers:**

   ```bash
   docker compose up -d --build
   ```

4. **Verify Deployment:**
   ```bash
   docker compose ps
   docker compose logs -f worker
   ```

## 5. SSL / HTTPS (Let's Encrypt)

By default, the `docker/nginx/nginx.conf` listens on port 80. Before taking real user traffic, you should secure this using Certbot or use a CDN (like Cloudflare) set to "Flexible" or "Full" mode.

To use Certbot on the instance natively:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 6. Scaling the Workers

If you are doing heavy CSV processing and your instance CPU usage is hitting 100%, you can scale the BullMQ workers:

```bash
# Scale to 3 worker containers
docker compose up -d --scale worker=3
```

## 7. Local Pre-Requisites Installation (For Local Development)

If you are running this locally (not via Docker), you will need the following installed on your machine:

### Node.js 18+

- Mac/Linux: Use nvm (Node Version Manager).
- Windows: Download the official installer from nodejs.org.

### PNPM v10+

Once Node is installed, install pnpm globally via npm.

### MongoDB

- Mac (Homebrew): Install mongodb-community@6.0 and start the service.
- Ubuntu/Linux: Follow the official guide at mongodb.com.
- Alternative: Use a free cloud database like MongoDB Atlas. Set your .env MONGO_URI accordingly.

### Redis Server

- Mac (Homebrew): Install redis and start the service.
- Ubuntu/Linux: Install redis-server via apt.
