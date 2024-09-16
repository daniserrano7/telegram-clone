import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DbService } from 'src/db/db.service';

@Module({
  controllers: [UserController],
  providers: [UserService, DbService, JwtService],
})
export class UserModule {}
