import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UploadService } from '../upload/upload.service';
import { BlockService } from './block.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UploadService, BlockService],
  exports: [BlockService],
})
export class UserModule {}
