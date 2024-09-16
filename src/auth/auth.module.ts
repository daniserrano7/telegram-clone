import { Module, Global } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DbService } from 'src/db/db.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, DbService, JwtService],
  exports: [AuthService],
})
export class AuthModule {}
