# Deployment Documentation

## Overview

This document describes the deployment process for the Telegram Clone application. The deployment is split into **manual setup** (infrastructure) and **automated deployment** (application code).

## Architecture

- **VPS Server**: Hosts the entire application
- **Components**:
  - **PostgreSQL Database**: Manually configured
  - **Nginx**: Manually configured as reverse proxy and static file server
  - **Server Application**: Automated deployment via GitHub Actions
  - **Web Application**: Automated deployment via GitHub Actions

## Manual Setup (One-time Infrastructure Setup)

### 1. VPS Prerequisites

- Ubuntu/Debian-based VPS
- SSH access with deploy user
- Domain pointing to VPS IP

### 2. Manual Infrastructure Components

#### PostgreSQL Database
- Install PostgreSQL on the VPS
- Create database: `telegram_clone`
- Create database user with appropriate permissions
- Configure connection settings

#### Nginx Configuration
- Install Nginx
- Configure as reverse proxy for the server application
- Serve static files for the web application
- Set up SSL/TLS certificates (Let's Encrypt recommended)
- Configure web root at `/var/www/telechat/web/`

#### System Dependencies
- Install Node.js (v14+)
- Install pnpm package manager
- Install PM2 for process management
- Install Git for code deployment

#### Directory Structure
```
/home/deploy/telechat/          # Application code repository
/var/www/telechat/web/          # Web application static files
```

#### User Setup
- Create `deploy` user with SSH access
- Configure SSH key authentication
- Grant necessary permissions for deployment operations

## Automated Deployment (GitHub Actions)

### Trigger Conditions
The deployment workflow (`.github/workflows/deploy.yml`) triggers on:
- Push to `master` branch
- Changes to specific paths:
  - `server/**` (server code)
  - `web/**` (web code)
  - `shared/**` (shared utilities)
  - `deploy-*.sh` (deployment scripts)
  - `.github/workflows/deploy.yml` (workflow itself)

### Deployment Process

#### 1. Change Detection
- Uses `dorny/paths-filter` to detect which components changed
- Runs separate jobs for server and web deployments
- Only deploys changed components

#### 2. Server Deployment (`deploy-server.sh`)
**Triggers when**: Server, shared, or deployment script changes

**Automated steps**:
1. SSH into VPS
2. Navigate to `/home/deploy/telechat`
3. Pull latest code from `master` branch
4. Install dependencies with `pnpm install --frozen-lockfile`
5. Build server application: `pnpm --filter server build`
6. Run database migrations: `pnpm --filter server prisma migrate deploy`
7. Restart server with PM2: `pm2 restart telegram-server`
8. Save PM2 state

#### 3. Web Deployment (`deploy-web.sh`)
**Triggers when**: Web, shared, or deployment script changes

**Automated steps**:
1. SSH into VPS
2. Navigate to `/home/deploy/telechat`
3. Pull latest code from `master` branch
4. Install dependencies with `pnpm install --frozen-lockfile`
5. Build web application with environment variables
6. Remove old static files from `/var/www/telechat/web/`
7. Copy new build to web root

### Required GitHub Secrets

Configure these in your GitHub repository settings under Secrets and Variables > Actions:

- `VPS_HOST`: VPS server IP address or hostname
- `VPS_USERNAME`: SSH username (typically `deploy`)
- `VPS_SSH_KEY`: Private SSH key for authentication
- `VITE_API_URL`: API endpoint URL for web application
- `VITE_WS_URL`: WebSocket endpoint URL for web application
- `VITE_PORT`: Port for the web application

### Environment Configuration

The workflow uses the `PROD` environment, which should be configured in GitHub with the above secrets.

## Deployment Scripts

### deploy-server.sh
- Located at project root
- Handles server-side deployment
- Includes database migration
- Manages PM2 process restart

### deploy-web.sh
- Located at project root
- Handles web application build and deployment
- Takes environment variables as arguments
- Copies built files to Nginx web root

## Manual Steps to Reproduce Full Setup

### 1. VPS Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install Git
sudo apt install git
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE telegram_clone;
CREATE USER deploy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE telegram_clone TO deploy_user;
\q
```

### 3. User and Directory Setup

```bash
# Create deploy user
sudo adduser deploy
sudo usermod -aG sudo deploy

# Create application directory
sudo mkdir -p /home/deploy/telechat
sudo chown deploy:deploy /home/deploy/telechat

# Create web directory
sudo mkdir -p /var/www/telechat/web
sudo chown deploy:deploy /var/www/telechat/web
```

### 4. SSH Key Setup

```bash
# Generate SSH key pair locally
ssh-keygen -t rsa -b 4096 -C "deploy@telegram-clone"

# Copy public key to VPS
ssh-copy-id deploy@your-vps-ip

# Add private key to GitHub Secrets as VPS_SSH_KEY
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/telechat`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Web application static files
    location / {
        root /var/www/telechat/web;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/telechat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Initial Code Deployment

```bash
# Clone repository
cd /home/deploy
git clone https://github.com/your-username/telegram-clone.git telechat
cd telechat

# Install dependencies
pnpm install

# Build server
pnpm --filter server build

# Set up database
pnpm --filter server prisma migrate deploy

# Start server with PM2
pm2 start pnpm --name "telegram-server" -- --filter server start
pm2 save
pm2 startup
```

### 7. GitHub Repository Setup

1. Add the required secrets to GitHub repository
2. Ensure the `deploy.yml` workflow file is present
3. Push changes to `master` branch to trigger first automated deployment

## Monitoring and Maintenance

### PM2 Management
```bash
# Check status
pm2 status

# View logs
pm2 logs telegram-server

# Restart service
pm2 restart telegram-server

# Monitor
pm2 monit
```

### Database Maintenance
```bash
# Backup database
pg_dump -U deploy_user telegram_clone > backup.sql

# Restore database
psql -U deploy_user telegram_clone < backup.sql
```

### Nginx Management
```bash
# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

## Troubleshooting

### Common Issues

1. **PM2 process not starting**: Check server logs and ensure database is accessible
2. **Web deployment fails**: Verify Nginx permissions and web root directory
3. **Database connection issues**: Check PostgreSQL service status and connection string
4. **SSH deployment fails**: Verify SSH key and VPS connectivity

### Log Locations

- **Server logs**: `pm2 logs telegram-server`
- **Nginx logs**: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **PostgreSQL logs**: `/var/log/postgresql/`

## Security Considerations

- Use SSH key authentication (no passwords)
- Configure firewall to only allow necessary ports
- Regular security updates
- Database user with minimal required permissions
- SSL/TLS certificates for HTTPS
- Environment variables for sensitive data