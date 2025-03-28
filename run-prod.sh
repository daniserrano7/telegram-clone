#!/bin/bash

# Stop any existing containers
docker-compose -f docker-compose.prod.yml down

# Remove the web_dist volume
docker volume rm telegram-clone_web_dist

# Start the production containers
docker-compose -f docker-compose.prod.yml --profile production up -d --build

# Show container logs
docker-compose -f docker-compose.prod.yml logs -f