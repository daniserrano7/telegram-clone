# 📱 Mobile WiFi Testing Guide

## Overview
This guide shows how to test your Telegram Clone app on your mobile phone over your local WiFi network.

## Your Network Configuration
- **Local IP Address**: `192.168.0.16`
- **Frontend Port**: `3000`
- **Backend Port**: `5000`

## 🔧 Configuration Steps

### 1. Update Your Environment Files

#### For Server (Backend)
Update your `server/.env.dev` file:
```bash
# Add your local IP to CORS origins
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://192.168.0.16:3000"

# Keep other settings as they are
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
PORT=5000
NODE_ENV="development"
```

#### For Web (Frontend)
Create or update your `web/.env.dev` file:
```bash
# Use your local IP instead of localhost
VITE_API_URL=http://192.168.0.16:5000/api
VITE_WS_URL=http://192.168.0.16:5000
VITE_PORT=3000

# Add your VAPID key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### 2. Start Your Development Servers

#### Terminal 1 - Backend:
```bash
cd server
pnpm run dev
```

#### Terminal 2 - Frontend:
```bash
cd web
pnpm run dev
```

### 3. Verify Servers Are Running

Check that both servers are accessible from your network:

#### Backend Health Check:
```bash
# From your computer
curl http://192.168.0.16:5000/api

# Should return: Cannot GET /api (this is expected)
```

#### Frontend Access:
```bash
# Open in your desktop browser
http://192.168.0.16:3000
```

### 4. Access From Your Mobile Phone

1. **Connect your phone to the same WiFi network as your computer**
2. **Open your mobile browser** (Chrome, Safari, etc.)
3. **Navigate to**: `http://192.168.0.16:3000`

## 🔍 Troubleshooting

### Issue: "Cannot connect to server"

**Solution 1 - Check Firewall:**
```bash
# macOS: Allow connections through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
# Re-enable after testing: --setglobalstate on
```

**Solution 2 - Check Network Interface:**
```bash
# Verify your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Solution 3 - Test Port Accessibility:**
```bash
# From another device on the same network
telnet 192.168.0.16 5000  # Backend
telnet 192.168.0.16 3000  # Frontend
```

### Issue: "CORS Error" 

Make sure your `server/.env.dev` includes:
```bash
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://192.168.0.16:3000"
```

### Issue: WebSocket connection fails

1. Check that `VITE_WS_URL=http://192.168.0.16:5000` (no `/api` suffix)
2. Verify WebSocket endpoint is accessible:
```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  -H "Sec-WebSocket-Version: 13" \
  http://192.168.0.16:5000/socket.io/
```

## 🚀 Quick Setup Commands

**1. Get your IP (if it changed):**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

**2. Update environment files with your IP:**
```bash
# Replace YOUR_IP with the result from step 1
echo "VITE_API_URL=http://YOUR_IP:5000/api" > web/.env.dev
echo "VITE_WS_URL=http://YOUR_IP:5000" >> web/.env.dev
echo "VITE_PORT=3000" >> web/.env.dev
```

**3. Add to server CORS (replace YOUR_IP):**
```bash
# Add this line to server/.env.dev
echo "ALLOWED_ORIGINS=\"http://localhost:3000,http://127.0.0.1:3000,http://YOUR_IP:3000\"" >> server/.env.dev
```

## 📱 Mobile-Specific Features to Test

1. **Touch interactions** - Tap, swipe, pinch-to-zoom
2. **Virtual keyboard** - Message input behavior
3. **Screen orientations** - Portrait vs landscape
4. **PWA features** - Add to Home Screen
5. **Push notifications** - If implemented
6. **Offline functionality** - Disconnect WiFi
7. **Performance** - Scrolling smoothness
8. **Responsive design** - Different screen sizes

## 🔄 Switching Back to Desktop Development

To switch back to localhost for desktop development:

```bash
# web/.env.dev
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000

# server/.env.dev  
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

## 📡 Network Requirements

- **Same WiFi Network**: Both computer and phone must be connected to the same network
- **No Network Isolation**: Some corporate or guest networks block device-to-device communication
- **Firewall**: macOS/Windows firewall should allow incoming connections on ports 3000 and 5000

## 🔒 Security Note

**For development only**: This configuration exposes your dev servers to your local network. Don't use these settings in production.

---

**Happy Mobile Testing!** 🎉