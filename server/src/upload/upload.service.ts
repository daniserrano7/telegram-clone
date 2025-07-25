import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { type Multer } from 'multer';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = 'uploads/avatars';

  constructor() {
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveAvatar(file: Multer.File): Promise<string> {
    const fileExt = path.extname(file.originalname);
    const fileName = crypto.randomBytes(16).toString('hex') + fileExt;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    // Return URL instead of file path
    return `/uploads/avatars/${fileName}`;
  }

  async deleteAvatar(avatarUrl: string) {
    if (!avatarUrl) return;

    try {
      const fileName = path.basename(avatarUrl);
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.error('Failed to delete avatar:', error);
    }
  }
}
