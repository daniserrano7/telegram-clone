import { Request, Response } from 'express';
import { conversationService } from './conversation.service';

const createConversation = async (req: Request, res: Response) => {
  const userIds = req.body.userIds;

  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: 'Invalid participant IDs' });
  }

  try {
    const conversation = await conversationService.createConversation(userIds);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getConversation = async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId;
  let conversationIdParsed: number;

  try {
    conversationIdParsed = parseInt(conversationId);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  try {
    const conversation = await conversationService.getConversation(
      conversationIdParsed
    );
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserConversations = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  let userIdParsed: number;

  try {
    userIdParsed = parseInt(userId);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const conversations = await conversationService.getUserConversations(
      userIdParsed
    );
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const conversationController = {
  createConversation,
  getConversation,
  getUserConversations,
};
