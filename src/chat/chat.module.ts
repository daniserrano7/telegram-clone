// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { DbService } from 'src/db/db.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, DbService, JwtService],
})
export class ChatModule {}
