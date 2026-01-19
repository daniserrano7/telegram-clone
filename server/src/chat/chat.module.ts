import { Module } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { UploadService } from '../upload/upload.service';
import { UserStatusService } from '../user/user-status.service';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from 'src/notification/notification.service';
import { BlockService } from 'src/user/block.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    UserService,
    UploadService,
    UserStatusService,
    NotificationService,
    BlockService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
