# Telegram Clone

A modern, feature-rich messaging application inspired by Telegram, built with React and NestJS, using WebSockets for real-time communication.

![Telegram Clone Screenshot](https://via.placeholder.com/800x450?text=Telegram+Clone+Screenshot)

## ✨ Features

- **Real-time Messaging**: Instant message delivery using WebSockets
- **Message Status Indicators**: Track when messages are sent, delivered, and read
- **Typing Indicators**: See when your chat partner is typing
- **Styled Message Bubbles**: Telegram-style message bubbles with tails and proper grouping
- **Chat Backgrounds**: Customizable backgrounds with patterns and gradients
- **User Avatars**: Display user avatars alongside messages
- **Message Search**: Search through chat history with highlighted results
- **Dark/Light Mode**: Toggle between dark and light themes
- **Message Grouping**: Messages are grouped by sender for better readability
- **Responsive Design**: Works on desktop and mobile devices
- **User Authentication**: Secure login and registration system
- **Persistent Storage**: Messages and user data stored in a database

## 🛠️ Technologies Used

### Frontend

- **Framework**: React with TypeScript
- **State Management**: Custom stores using Zustand
- **Styling**: Tailwind CSS with custom components
- **Real-time Client**: Socket.io client

### Backend

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth system
- **Real-time Communication**: Socket.io with WebSockets
- **File Storage**: Local file system for uploads
- **API**: RESTful endpoints for data operations

### Development & Tooling

- **Package Management**: pnpm with workspaces
- **Testing**: Vitest for unit and E2E testing
- **Optimization**: Memoization and performance-focused rendering

## 🚀 Installation

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm or yarn or pnpm
- PostgreSQL database

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/daniserrano7/telegram-clone.git
   cd telegram-clone
   ```

2. Install frontenddependencies:

   ```bash
   cd web
   # Using pnpm (recommended)
   pnpm install
   ```

3. Install backend dependencies:

   ```bash
   cd server
   # Using pnpm (recommended)
   pnpm install
   ```

4. Environment variables:
   Create a `.env` file in the server directory with the following variables:

   ```
   # Server .env
   DATABASE_URL="postgresql://username:password@localhost:5432/telegram_clone"
   JWT_SECRET=your_jwt_secret
   PORT=5000

   # For testing
   # Create a .env.test file with a separate test database
   ```

5. Set up the database:

   ```bash
   # In the server directory
   cd server
   pnpm prisma-push
   ```

## 💻 Usage

### Development

1. Start both the backend and frontend servers:

   ```bash
   # In the root directory
   pnpm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
telegram-clone/
├── server/                # NestJS backend application
│   ├── prisma/            # Database schema and migrations
│   ├── src/               # Source code
│   │   ├── auth/          # Authentication module
│   │   ├── chat/          # Chat functionality and WebSockets
│   │   ├── user/          # User management
│   │   ├── upload/        # File upload handling
│   │   └── db/            # Database configuration
├── shared/                # Shared types and utilities
├── web/                   # React frontend application
│   ├── public/            # Static files
│   └── src/               # Source code
│       ├── components/    # React components
│       ├── stores/        # Zustand state stores
│       ├── utils/         # Utility functions
│       └── App.tsx        # Main application component
└── README.md              # This file
```

## ⚡ Performance Optimizations

- **Efficient Background Rendering**: Lightweight CSS patterns instead of heavy SVGs
- **Database Indexing**: Optimized queries for chat history and user data
- **WebSocket Connection Pooling**: Efficient handling of multiple concurrent connections

## 🧩 Challenges and Solutions

- **Scrolling Performance**: Optimized background rendering and message components to ensure smooth scrolling even with many messages
- **Real-time Updates**: Implemented efficient WebSocket handling to manage typing indicators and message status updates without UI jitter
- **Database Schema Design**: Structured the database to efficiently handle relationships between users, chats, and messages

## 🔮 Future Improvements

- File sharing
- End-to-end encryption
- Group chats
- Message reactions
- Message forwarding
- Offline support with local caching

## 📫 Contact

- GitHub: [@daniserrano7](https://github.com/daniserrano7)

---

_This project is for educational purposes and is not affiliated with Telegram._
