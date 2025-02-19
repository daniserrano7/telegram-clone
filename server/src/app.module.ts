import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    DbModule,
    AuthModule,
    ChatModule,
    UserModule,
    ConfigModule.forRoot(),
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
