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
  Delete,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request, Response } from 'express';
import { ChatGateway } from './chat.gateway';

@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async createChat(
    @Req() req: Request & { user: { id: number } },
    @Body('userIds') userIds: number[],
    @Body('content') content: string,
    @Res() res: Response,
  ) {
    if (!userIds || !userIds.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'field userIds is required',
      });
    }

    if (!content) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'field content is required',
      });
    }

    const userId = req.user.id;

    try {
      const chat = await this.chatService.createChat(userIds);
      await this.chatService.addMessage(chat.id, userId, content);
      this.chatGateway.emitNewChat(chat.id, userIds);
      return res.status(HttpStatus.CREATED).json(chat);
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create chat',
        error: error.message,
      });
    }
  }

  // Get chat by ID
  @UseGuards(AuthGuard)
  @Get(':chatId')
  async getChatById(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Res() res: Response,
  ) {
    try {
      const chat = await this.chatService.getChat(chatId);

      if (!chat) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Chat not found' });
      }
      return res.status(HttpStatus.OK).json(chat);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve chat',
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
        return res.status(HttpStatus.OK).json([]);
      }

      return res.status(HttpStatus.OK).json(chats);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve chats',
        error: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Get('shared')
  async getSharedChats(@Query() query, @Res() res: Response) {
    const userId1 = query.userId1 as string;
    const userId2 = query.userId2 as string;

    if (!userId1 || !userId2) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'fields userId1 and userId2 are required',
      });
    }

    try {
      const chat = await this.chatService.getSharedChats(
        parseInt(userId1),
        parseInt(userId2),
      );

      if (!chat) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'No shared chats found',
        });
      }

      return res.status(HttpStatus.OK).json(chat);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve shared chats',
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

  // Delete chat
  @UseGuards(AuthGuard)
  @Delete(':chatId')
  async deleteChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Req() req: Request & { user: { id: number } },
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    try {
      const { success } = await this.chatService.deleteChat(chatId, userId);

      if (success) {
        return res.status(HttpStatus.NO_CONTENT).send();
      }

      return res.status(HttpStatus.NOT_FOUND).json({
        message: 'Chat not found',
      });
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete chat',
        error: error.message,
      });
    }
  }
}
