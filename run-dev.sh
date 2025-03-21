#!/bin/bash

# Load variables from .env.dev file
export $(grep -v '^#' .env.dev | xargs)

# Stop any existing containers
docker-compose down

# Start the development containers
docker-compose up -d postgres server web

# Show container logs
docker-compose logs -f