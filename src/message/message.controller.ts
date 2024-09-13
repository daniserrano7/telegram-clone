import { Request, Response } from 'express';
import { messageService } from './message.service';

const sendMessage = async (req: Request, res: Response) => {
  try {
    const { senderId, conversationId, content } = req.body;

    if (typeof senderId !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid sender ID data type',
      });
    }

    const message = await messageService.sendMessage(
      conversationId,
      senderId,
      content
    );

    const io = req.app.get('socketio');
    io.to(conversationId).emit('newMessage', message);

    return res.status(201).json({
      success: true,
      message: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

const getMessages = async (req: Request, res: Response) => {
  let conversationId = req.params.conversationId;
  let conversationIdParsed: number;

  try {
    conversationIdParsed = parseInt(conversationId);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  try {
    const messages = await messageService.getMessages(conversationIdParsed);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const messageController = {
  sendMessage,
  getMessages,
};
