import { Module } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { UploadService } from '../upload/upload.service';
@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, UserService, UploadService],
})
export class ChatModule {}
