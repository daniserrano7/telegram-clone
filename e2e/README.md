# E2E Tests

End-to-end tests for the telegram-clone application using Playwright.

## Setup

1. Install dependencies:

```bash
cd e2e
pnpm install
```

2. Install Playwright browsers:

```bash
pnpm install-browsers
```

3. Set up environment variables:

```bash
# Copy the example file
cp env.example .env

# Edit .env with your specific values if needed
```

## Running Tests

### Prerequisites

Make sure the application stack is running:

```bash
# Option 1: Docker compose
docker-compose up -d

# Option 2: Development servers
pnpm dev
```

### Run Tests

```bash
# From e2e directory
pnpm test

# From root directory
pnpm e2e
```

### Other Commands

```bash
# Run with browser visible
pnpm test:headed

# Run with Playwright UI
pnpm test:ui
```

## Test Structure

- `tests/auth.spec.ts` - Authentication flows (register, login, stored credentials)
- `tests/chat.spec.ts` - Core chat features tested after each auth scenario
- `utils/api.ts` - Helper functions for API interactions

## Environment Variables

The following environment variables can be set in `e2e/.env` (see `env.example`):

- `E2E_BASE_URL` - Web app URL (default: http://localhost:5173)
- `E2E_API_URL` - API server URL (default: http://localhost:3000)
- `E2E_WS_URL` - WebSocket URL (default: ws://localhost:3000)

## Test Scenarios

The chat tests verify core functionality works regardless of how the user authenticated:

1. **After Register** - User registers via UI, then tests chat features
2. **After Login** - User logs in via UI, then tests chat features
3. **Stored Credentials** - User opens app with saved auth, then tests chat features

Each scenario includes:

- Opening a new chat with another user
- Sending a message
- Receiving a message from the other user
