# Use a Node.js base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy monorepo files
COPY . .

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile --force

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
