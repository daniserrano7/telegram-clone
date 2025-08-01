#!/bin/bash
set -e

echo "Deploying web app..."

# Navigate to app directory
cd /home/deploy/telechat

# Pull latest code
git pull origin master

# Install dependencies
pnpm install --frozen-lockfile

# Build web app with env vars
VITE_API_URL=$1 VITE_WS_URL=$2 VITE_PORT=$3 pnpm --filter web build

# Copy built files to web root
rm -rf /var/www/telechat/web/*
cp -r web/dist/* /var/www/telechat/web/

echo "Web app deployed successfully!"