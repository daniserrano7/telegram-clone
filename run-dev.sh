#!/bin/bash

# Load variables from .env.production files
export $(grep -v '^#' ./server/.env.production | xargs)
export $(grep -v '^#' ./web/.env.production | xargs)

# Stop any existing containers
docker-compose down

# Remove the web_dist volume
docker volume rm telegram-clone_web_dist

# Start the production containers
docker-compose --profile production up -d --build

# Show container logs
docker-compose logs -f