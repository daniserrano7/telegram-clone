#!/bin/bash

# Load variables from .env.production file
export $(grep -v '^#' .env.prod | xargs)

# Stop any existing containers
docker-compose down

# Start the production containers
docker-compose --profile production up -d

# Show container logs
docker-compose logs -f