#!/bin/bash

# Stop any existing containers
docker-compose down

# Start the production containers
docker-compose --profile production up -d --build

# Show container logs
docker-compose logs -f