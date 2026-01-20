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
  Logger,
  Patch,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request, Response } from 'express';
import { ChatGateway } from './chat.gateway';
import { UserService } from '../user/user.service';
import {
  CreateGroupRequestDto,
  UpdateGroupRequestDto,
  AddMembersRequestDto,
} from '@shared/chat.dto';
import { ChatMemberRole } from '@shared/gateway.dto';

@Controller('chats')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly userService: UserService,
  ) {}

  // ==================== DIRECT CHAT ENDPOINTS ====================

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
      const updatedChat = await this.chatService.getChat(chat.id);
      this.chatGateway.emitNewChat(chat.id, userIds);
      return res.status(HttpStatus.CREATED).json(updatedChat);
    } catch (error) {
      this.logger.error('Failed to create chat:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create chat',
        error: error.message,
      });
    }
  }

  // ==================== GROUP CHAT ENDPOINTS ====================

  @UseGuards(AuthGuard)
  @Post('groups')
  async createGroup(
    @Req() req: Request & { user: { id: number } },
    @Body() body: CreateGroupRequestDto,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const { name, description, avatarUrl, userIds, content } = body;

    if (!name || name.trim() === '') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Group name is required',
      });
    }

    if (!userIds || userIds.length < 1) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'At least one other member is required',
      });
    }

    try {
      // Include creator in member list
      const allMemberIds = [...new Set([userId, ...userIds])];

      const chat = await this.chatService.createGroup(allMemberIds, userId, {
        name,
        description,
        avatarUrl,
      });

      // Add initial message if provided
      if (content) {
        await this.chatService.addMessage(chat.id, userId, content);
      }

      // Get creator's username for system message
      const creator = await this.userService.getUserById(userId);

      // Create system message
      await this.chatService.createSystemMessage(
        chat.id,
        `${creator.username} created the group "${name}"`,
        { type: 'GROUP_CREATED', userId },
      );

      const updatedChat = await this.chatService.getChat(chat.id);

      // Emit to all members
      this.chatGateway.emitNewChat(chat.id, allMemberIds);

      return res.status(HttpStatus.CREATED).json(updatedChat);
    } catch (error) {
      this.logger.error('Failed to create group:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create group',
        error: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Patch('groups/:chatId')
  async updateGroup(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Req() req: Request & { user: { id: number } },
    @Body() updates: UpdateGroupRequestDto,
    @Res() res: Response,
  ) {
    try {
      const chat = await this.chatService.updateGroup(
        chatId,
        req.user.id,
        updates,
      );

      // Get user who updated for system message
      const user = await this.userService.getUserById(req.user.id);

      // Create system message for significant changes
      if (updates.name) {
        await this.chatService.createSystemMessage(
          chatId,
          `${user.username} changed the group name to "${updates.name}"`,
          { type: 'GROUP_NAME_CHANGED', userId: req.user.id, name: updates.name },
        );
      }

      // Emit update event to all members
      const memberIds = chat.members.map((m) => m.id);
      this.chatGateway.emitGroupUpdated(chatId, chat, memberIds);

      return res.status(HttpStatus.OK).json(chat);
    } catch (error) {
      this.logger.error('Failed to update group:', error);
      return res.status(HttpStatus.FORBIDDEN).json({
        message: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Post('groups/:chatId/members')
  async addMembers(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Req() req: Request & { user: { id: number } },
    @Body() body: AddMembersRequestDto,
    @Res() res: Response,
  ) {
    try {
      const chat = await this.chatService.addMembers(
        chatId,
        body.userIds,
        req.user.id,
      );

      // Get usernames for system messages
      const adder = await this.userService.getUserById(req.user.id);

      for (const userId of body.userIds) {
        const addedUser = await this.userService.getUserById(userId);
        await this.chatService.createSystemMessage(
          chatId,
          `${adder.username} added ${addedUser.username}`,
          { type: 'MEMBER_ADDED', addedBy: req.user.id, userId },
        );
      }

      // Emit to all members including new ones
      const allMemberIds = chat.members.map((m) => m.id);
      this.chatGateway.emitMembersAdded(chatId, body.userIds, allMemberIds);

      return res.status(HttpStatus.OK).json(chat);
    } catch (error) {
      this.logger.error('Failed to add members:', error);
      return res.status(HttpStatus.FORBIDDEN).json({
        message: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Delete('groups/:chatId/members/:userId')
  async removeMember(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) userIdToRemove: number,
    @Req() req: Request & { user: { id: number } },
    @Res() res: Response,
  ) {
    try {
      // Get usernames before removal for system message
      const remover = await this.userService.getUserById(req.user.id);
      const removedUser = await this.userService.getUserById(userIdToRemove);

      const chat = await this.chatService.removeMember(
        chatId,
        userIdToRemove,
        req.user.id,
      );

      // Create system message
      await this.chatService.createSystemMessage(
        chatId,
        `${remover.username} removed ${removedUser.username}`,
        { type: 'MEMBER_REMOVED', removedBy: req.user.id, userId: userIdToRemove },
      );

      // Emit to remaining members and the removed user
      const remainingMemberIds = chat.members.map((m) => m.id);
      this.chatGateway.emitMemberRemoved(
        chatId,
        userIdToRemove,
        remainingMemberIds,
      );

      return res.status(HttpStatus.OK).json(chat);
    } catch (error) {
      this.logger.error('Failed to remove member:', error);
      return res.status(HttpStatus.FORBIDDEN).json({
        message: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Post('groups/:chatId/leave')
  async leaveGroup(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Req() req: Request & { user: { id: number } },
    @Res() res: Response,
  ) {
    try {
      // Get username for system message
      const user = await this.userService.getUserById(req.user.id);

      // Get chat before leaving to know remaining members
      const chat = await this.chatService.getChat(chatId);

      await this.chatService.leaveGroup(chatId, req.user.id);

      // Create system message
      await this.chatService.createSystemMessage(
        chatId,
        `${user.username} left the group`,
        { type: 'MEMBER_LEFT', userId: req.user.id },
      );

      // Emit to remaining members
      const remainingMemberIds = chat.members
        .filter((m) => m.id !== req.user.id)
        .map((m) => m.id);
      this.chatGateway.emitMemberLeft(chatId, req.user.id, remainingMemberIds);

      return res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      this.logger.error('Failed to leave group:', error);
      return res.status(HttpStatus.FORBIDDEN).json({
        message: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Patch('groups/:chatId/members/:userId/role')
  async updateMemberRole(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Req() req: Request & { user: { id: number } },
    @Body('role') role: ChatMemberRole,
    @Res() res: Response,
  ) {
    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Valid role (ADMIN or MEMBER) is required',
      });
    }

    try {
      const chat = await this.chatService.updateMemberRole(
        chatId,
        targetUserId,
        role,
        req.user.id,
      );

      // Get usernames for system message
      const updater = await this.userService.getUserById(req.user.id);
      const targetUser = await this.userService.getUserById(targetUserId);

      const roleText = role === 'ADMIN' ? 'an admin' : 'a member';
      await this.chatService.createSystemMessage(
        chatId,
        `${updater.username} made ${targetUser.username} ${roleText}`,
        { type: 'MEMBER_ROLE_CHANGED', updatedBy: req.user.id, userId: targetUserId, role },
      );

      const memberIds = chat.members.map((m) => m.id);
      this.chatGateway.emitMemberRoleChanged(chatId, targetUserId, role, memberIds);

      return res.status(HttpStatus.OK).json(chat);
    } catch (error) {
      this.logger.error('Failed to update member role:', error);
      return res.status(HttpStatus.FORBIDDEN).json({
        message: error.message,
      });
    }
  }

  // ==================== COMMON ENDPOINTS ====================

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
      this.logger.error('Failed to delete chat:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete chat',
        error: error.message,
      });
    }
  }
}
