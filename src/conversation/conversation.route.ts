import express from 'express';
import { conversationController } from './conversation.controller';
import { verifyToken } from '../auth/auth.middleware';

const router = express.Router();

router.post('/', verifyToken, conversationController.createConversation);
router.get(
  '/:conversationId',
  verifyToken,
  conversationController.getConversation
);
router.get(
  '/user/:userId',
  verifyToken,
  conversationController.getUserConversations
);

export const conversationRouter = router;
