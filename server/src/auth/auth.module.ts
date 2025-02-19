import { Module, Global } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService } from 'src/db/db.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, DbService],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
