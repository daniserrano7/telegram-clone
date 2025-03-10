# Use a Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Configure pnpm to automatically say yes to all prompts
RUN pnpm config set auto-install-peers true
RUN pnpm config set yes true

# Copy monorepo files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Migrate the database
# RUN cd server && pnpm prisma migrate deploy

# Generate Prisma client (if needed)
RUN cd server && pnpm prisma generate

# Build the backend
RUN pnpm --filter server run build

# Expose the port
EXPOSE 5000

# Start the server
# CMD ["pnpm", "--filter", "server", "run", "start:dev"]
CMD ["pnpm", "--filter", "server", "run", "start:prod:migrate"]
