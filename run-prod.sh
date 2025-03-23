#!/bin/bash

# Stop any existing containers
docker-compose down

# Remove the web_dist volume
docker volume rm telegram-clone_web_dist

# Start the production containers
docker-compose --profile production up -d --build

# Show container logs
docker-compose logs -f