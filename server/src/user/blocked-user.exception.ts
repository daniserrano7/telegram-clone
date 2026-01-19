import { BadRequestException } from '@nestjs/common';

export class BlockedUserException extends BadRequestException {
  constructor(message: string = 'Cannot send message to blocked user') {
    super(message);
  }
}
