import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('avatars/:filename')
  async serveAvatar(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = join(process.cwd(), 'uploads/avatars', filename);
      return res.sendFile(filePath);
    } catch {
      throw new NotFoundException('Avatar not found');
    }
  }
}
