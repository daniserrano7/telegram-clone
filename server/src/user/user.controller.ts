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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { type Multer } from 'multer';
import { UserId } from '@shared/user.dto';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { UploadService } from '../upload/upload.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
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

  // Get user by ID
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

  // Get contacts statuses
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
