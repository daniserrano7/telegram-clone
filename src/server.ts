import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { messageRouter } from './message/message.route';
import { conversationRouter } from './conversation/conversation.route';
import { authRouter } from './auth/auth.route';

dotenv.config({ path: '../.env' });

const app = express();
app.use(express.json());
app.use('/api/message', messageRouter);
app.use('/api/conversation', conversationRouter);
app.use('/api/auth', authRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation ${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
