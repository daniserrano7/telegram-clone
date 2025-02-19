import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from '@shared/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerUserDto: RegisterRequestDto,
    @Res() res: Response,
  ) {
    try {
      const { email, username, password } = registerUserDto;

      if (!email) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Email is required' });
      }

      if (!username) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Username is required' });
      }

      if (!password) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Password is required' });
      }
      const { user, token } = await this.authService.register({
        email,
        username,
        password,
      });
      return res.json({ token, user });
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.message === 'User already exists'
          ? error.message
          : 'Server internal error';

      const status: HttpStatus =
        errorMsg === 'User already exists'
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;

      return res.status(status).json({ error: errorMsg });
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    try {
      if (!username) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Username is required' });
      }

      if (!password) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Password is required' });
      }

      const { token, user } = await this.authService.login(username, password);
      return res.json({ token, user });
    } catch (error) {
      console.error(error?.message || 'Error on login controller');
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ error: 'Invalid credentials' });
    }
  }
}
