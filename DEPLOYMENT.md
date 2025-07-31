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

### Application Secrets
- `JWT_SECRET` - Random string for JWT signing (generate with `openssl rand -base64 32`)
- `ALLOWED_ORIGINS` - Frontend URL (e.g., `https://yourdomain.com`)
- `VITE_API_URL` - Backend API URL (e.g., `https://yourdomain.com/api`)
- `VITE_WS_URL` - WebSocket URL (e.g., `wss://yourdomain.com`)
- `VITE_PORT` - Frontend port (usually `80`)

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

1. **Trigger:** Push to `master` branch with changes in `server/`, `web/`, or `shared/` directories
2. **Change Detection:** Only builds components that have changed
3. **Docker Build:** Builds and pushes images to Docker Hub
4. **Deploy:** SSH to VPS and runs docker-compose with injected environment variables

## Manual Deployment (if needed)

If you need to deploy manually:

```bash
# On your VPS
cd /opt/telegram-clone
export DOCKERHUB_USERNAME="your_username"
# ... export all other env vars
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

Check deployment status:
```bash
# On VPS
cd /opt/telegram-clone
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```