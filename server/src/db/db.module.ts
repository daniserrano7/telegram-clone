import { Module, Global } from '@nestjs/common';
import { DbService } from './db.service';

@Global()
@Module({
  controllers: [],
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
