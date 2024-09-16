import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [DbModule, AuthModule, ChatModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
