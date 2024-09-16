import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Response } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  async getUserById(@Param('id') userId: number, @Res() res: Response) {
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

  // Delete user
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id') userId: number, @Res() res: Response) {
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
}
