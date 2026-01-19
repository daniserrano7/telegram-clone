import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  UseGuards,
  ParseIntPipe,
  Res,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { type Multer } from 'multer';
import { UserId } from '@shared/user.dto';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { UploadService } from '../upload/upload.service';
import { BlockService } from './block.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
    private readonly blockService: BlockService,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.userService.getAllUsers();
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve users',
        error: error.message,
      });
    }
  }

  // Get all blocked users for current user - MUST come before @Get(':id')
  @UseGuards(AuthGuard)
  @Get('blocked')
  async getBlockedUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Unauthorized',
        });
      }

      const blockedUsers = await this.blockService.getBlockedUsers(userId);
      return res.status(HttpStatus.OK).json(blockedUsers);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve blocked users',
        error: error.message,
      });
    }
  }

  // Get contacts statuses - MUST come before @Get(':id')
  @UseGuards(AuthGuard)
  @Get('contacts/:userId')
  async getContactsStatuses(
    @Param('userId', ParseIntPipe) userId: UserId,
    @Res() res: Response,
  ) {
    try {
      const contactsStatuses = await this.userService.getUserContacts(userId);
      return res.status(HttpStatus.OK).json(contactsStatuses);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve contacts statuses',
        error: error.message,
      });
    }
  }

  // Get user by ID - This comes AFTER more specific routes
  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) userId: number,
    @Res() res: Response,
  ) {
    try {
      const user = await this.userService.getUserById(userId);
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: error.message });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve user',
        error: error.message,
      });
    }
  }

  // Search users
  @UseGuards(AuthGuard)
  @Post('search')
  async searchUsers(@Body('search') search: string, @Res() res: Response) {
    try {
      const users = await this.userService.searchUsers(search);
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to search users',
        error: error.message,
      });
    }
  }

  // Delete user
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) userId: UserId,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userService.deleteUser(userId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: error.message });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete user',
        error: error.message,
      });
    }
  }

  // Block a user
  @UseGuards(AuthGuard)
  @Post(':id/block')
  async blockUser(
    @Param('id', ParseIntPipe) blockedId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const blockerId = (req as any).user?.id;
      if (!blockerId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Unauthorized',
        });
      }

      if (blockerId === blockedId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Cannot block yourself',
        });
      }

      await this.blockService.blockUser(blockerId, blockedId);
      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      if (error.message === 'Cannot block yourself') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to block user',
        error: error.message,
      });
    }
  }

  // Unblock a user
  @UseGuards(AuthGuard)
  @Delete(':id/block')
  async unblockUser(
    @Param('id', ParseIntPipe) blockedId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const blockerId = (req as any).user?.id;
      if (!blockerId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Unauthorized',
        });
      }

      await this.blockService.unblockUser(blockerId, blockedId);
      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error for not found
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'Block relationship not found',
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to unblock user',
        error: error.message,
      });
    }
  }

  // Get block status between two users
  @UseGuards(AuthGuard)
  @Get(':id/block-status')
  async getBlockStatus(
    @Param('id', ParseIntPipe) userId2: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const userId1 = (req as any).user?.id;
      if (!userId1) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Unauthorized',
        });
      }

      const blockStatus = await this.blockService.getBlockStatus(userId1, userId2);
      return res.status(HttpStatus.OK).json(blockStatus);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve block status',
        error: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Post(':id/bio')
  async updateUserBio(
    @Param('id', ParseIntPipe) userId: number,
    @Body('bio') bio: string,
    @Res() res: Response,
  ) {
    try {
      const user = await this.userService.updateUserBio(userId, bio);
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to update bio',
        error: error.message,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUserAvatar(
    @Param('id', ParseIntPipe) userId: number,
    @UploadedFile() file: Multer.File,
    @Res() res: Response,
  ) {
    try {
      const avatarUrl = await this.uploadService.saveAvatar(file);
      const user = await this.userService.updateUserAvatar(userId, avatarUrl);
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to update avatar',
        error: error.message,
      });
    }
  }
}
