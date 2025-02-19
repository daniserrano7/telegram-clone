import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UploadService } from '../upload/upload.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UploadService],
})
export class UserModule {}
