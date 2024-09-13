import express from 'express';
import { verifyToken } from '../auth/auth.middleware';
import { messageController } from './message.controller';

const router = express.Router();

// Ruta para enviar un mensaje
router.post('/send', verifyToken, messageController.sendMessage);
router.get('/:conversationId', verifyToken, messageController.getMessages);

export const messageRouter = router;
