import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request, Response } from 'express';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard)
  @Post()
  async createChat(
    @Req() _: Request,
    @Body('userIds') userIds: number[],
    @Res() res: Response,
  ) {
    if (!userIds || !userIds.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'field memberIds is required',
      });
    }

    try {
      const chat = await this.chatService.createChat(userIds);
      return res.status(HttpStatus.CREATED).json(chat);
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create chat',
        error: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Get('user/:userId')
  async getUserChats(
    @Param('userId', ParseIntPipe) userId: number,
    @Res() res: Response,
  ) {
    try {
      const chats = await this.chatService.getUserChats(userId);
      if (!chats.length) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'No chats found' });
      }
      return res.status(HttpStatus.OK).json(chats);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve chats',
        error: error.message,
      });
    }
  }

  // Add message to chat
  @UseGuards(AuthGuard)
  @Post(':chatId/messages')
  async addMessage(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body('content') content: string,
    @Req() req: Request & { user: { id: number } },
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    if (!content) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'field content is required',
      });
    }

    try {
      const message = await this.chatService.addMessage(
        chatId,
        userId,
        content,
      );
      return res.status(HttpStatus.CREATED).json(message);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to add message',
        error: error.message,
      });
    }
  }

  // Get chat messages
  @UseGuards(AuthGuard)
  @Get(':chatId/messages')
  async getChatMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Res() res: Response,
  ) {
    try {
      const messages = await this.chatService.getChatMessages(chatId);
      if (!messages.length) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'No messages found' });
      }
      return res.status(HttpStatus.OK).json(messages);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve messages',
        error: error.message,
      });
    }
  }
}
