

#!/bin/bash
set -e

echo "Deploying server..."

# Navigate to app directory
cd /home/deploy/telechat

# Pull latest code
git pull origin master

# Install dependencies
pnpm install --frozen-lockfile

# Build server (if using TypeScript)
pnpm --filter server build

# Run database migrations
pnpm --filter server prisma migrate deploy

# Restart server with PM2
pm2 restart telegram-server || pm2 start pnpm --name "telegram-server" -- --filter server start

# Save PM2 state
pm2 save

echo "Server deployed successfully!"