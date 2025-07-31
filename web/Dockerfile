# Use a Node.js base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Accept build arguments (these come from docker-compose or GitHub Actions)
ARG VITE_API_URL
ARG VITE_WS_URL  
ARG VITE_PORT

# Copy monorepo files
COPY . .

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile --force

# Create .env file in web directory from build args
RUN echo "VITE_API_URL=${VITE_API_URL}" > web/.env && \
    echo "VITE_WS_URL=${VITE_WS_URL}" >> web/.env && \
    echo "VITE_PORT=${VITE_PORT}" >> web/.env && \
    echo "Created web/.env with:" && cat web/.env

# Build the frontend
RUN pnpm --filter web build

# Use an Nginx image for serving static files
FROM nginx:alpine AS runtime

# Copy built frontend files to Nginx public directory
COPY --from=builder /app/web/dist /app/web/dist

# Expose the port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
