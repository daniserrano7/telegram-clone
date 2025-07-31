# Deployment Setup Guide

## GitHub Secrets Configuration

You need to set up the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

### Docker Hub Secrets
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token (create at hub.docker.com > Account Settings > Security)

### VPS Connection Secrets
- `VPS_HOST` - Your VPS IP address (e.g., `123.456.789.012`)
- `VPS_USERNAME` - SSH username (usually `root` or your user)
- `VPS_SSH_KEY` - Private SSH key content (the entire content of your `~/.ssh/id_rsa` file)

### Database Secrets
- `DB_USER` - PostgreSQL username (e.g., `telegram_user`)
- `DB_NAME` - PostgreSQL database name (e.g., `telegram_db`)
- `DB_PASSWORD` - PostgreSQL password
- `DATABASE_URL` - Full database connection string:  
  `postgresql://DB_USER:DB_PASSWORD@postgres:5432/DB_NAME`

### Application Secrets (Production)
- `JWT_SECRET` - Random string for JWT signing (generate with `openssl rand -base64 32`)
- `ALLOWED_ORIGINS` - Frontend URL (e.g., `http://YOUR_VPS_IP`)
- `VITE_API_URL` - Backend API URL (e.g., `http://YOUR_VPS_IP/api`)
- `VITE_WS_URL` - WebSocket URL (e.g., `ws://YOUR_VPS_IP`)
- `VITE_PORT` - Frontend port (usually `80`)

### Development Environment Secrets
- `DEV_JWT_SECRET` - Random string for JWT signing (different from prod)
- `DEV_ALLOWED_ORIGINS` - Dev frontend URL (e.g., `http://YOUR_VPS_IP:8080`)
- `DEV_VITE_API_URL` - Dev backend API URL (e.g., `http://YOUR_VPS_IP:8080/api`)
- `DEV_VITE_WS_URL` - Dev WebSocket URL (e.g., `ws://YOUR_VPS_IP:8080`)
- `DEV_DATABASE_URL` - Dev database connection string:  
  `postgresql://DEV_DB_USER:DEV_DB_PASSWORD@postgres:5432/DEV_DB_NAME`
- `DEV_DB_USER` - Dev PostgreSQL username (e.g., `telegram_dev_user`)
- `DEV_DB_NAME` - Dev PostgreSQL database name (e.g., `telegram_dev_db`)
- `DEV_DB_PASSWORD` - Dev PostgreSQL password

## VPS Initial Setup

1. **Connect to your VPS:**
   ```bash
   ssh root@YOUR_VPS_IP
   ```

2. **Update system:**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   systemctl start docker
   systemctl enable docker
   ```

4. **Install Docker Compose:**
   ```bash
   curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

5. **Set up firewall:**
   ```bash
   ufw allow OpenSSH
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw --force enable
   ```

6. **Generate SSH key (if needed):**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   ```
   Copy the private key content (`cat ~/.ssh/id_rsa`) to use as `VPS_SSH_KEY` secret.

## How the Deployment Works

### Production Deployment
1. **Trigger:** Push to `master` branch with changes in `server/`, `web/`, or `shared/` directories
2. **Change Detection:** Only builds components that have changed
3. **Docker Build:** Builds and pushes images to Docker Hub with `:latest` tags
4. **Deploy:** SSH to VPS and runs docker-compose in `/opt/telegram-clone` (accessible on port 80)

### Development Deployment
1. **Trigger:** Push to `develop` branch with changes in `server/`, `web/`, or `shared/` directories
2. **Change Detection:** Only builds components that have changed
3. **Docker Build:** Builds and pushes images to Docker Hub with `:dev-latest` tags
4. **Deploy:** SSH to VPS and runs docker-compose in `/opt/telegram-clone-dev` (accessible on port 8080)

## Manual Deployment (if needed)

### Production
```bash
# On your VPS
cd /opt/telegram-clone
export DOCKERHUB_USERNAME="your_username"
# ... export all other env vars
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Development
```bash
# On your VPS
cd /opt/telegram-clone-dev
export DOCKERHUB_USERNAME="your_username"
# ... export all other DEV env vars
docker-compose -f docker-compose.dev.yml pull
docker-compose -f docker-compose.dev.yml up -d
```

## Monitoring

### Production
```bash
# On VPS
cd /opt/telegram-clone
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

### Development
```bash
# On VPS
cd /opt/telegram-clone-dev
docker-compose -f docker-compose.dev.yml ps
docker-compose -f docker-compose.dev.yml logs
```

## Local Testing

Test the Docker setup locally before deploying:

```bash
# Test with local environment
docker-compose --env-file .env.local up --build

# Test URLs:
# - Frontend: http://localhost (nginx proxy)
# - Backend API: http://localhost:8001/api
# - Database: localhost:8000 (for debugging)

# Clean up after testing
docker-compose --env-file .env.local down -v
```