import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { UploadModule } from './upload/upload.module';
import { HealthModule } from './health/health.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    DbModule,
    AuthModule,
    ChatModule,
    UserModule,
    HealthModule,
    NotificationModule,
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
