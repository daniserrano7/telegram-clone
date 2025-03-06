import { Module } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { UploadService } from '../upload/upload.service';
import { UserStatusService } from '../user/user-status.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    UserService,
    UploadService,
    UserStatusService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
