import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, ChatModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
