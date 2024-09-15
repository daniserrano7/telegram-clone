import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.register(email, password);
      const { token } = await this.authService.login(email, password);
      return res.json({ token, user });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Server internal error' });
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    try {
      const { token, user } = await this.authService.login(email, password);
      return res.json({ token, user });
    } catch (error) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ error: 'Invalid credentials' });
    }
  }
}
