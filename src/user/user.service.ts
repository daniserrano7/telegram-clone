import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class UserService {
  constructor(private readonly db: DbService) {}

  async getAllUsers() {
    return await this.db.user.findMany();
  }

  async getUserById(userId: number) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async deleteUser(userId: number) {
    const user = await this.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.db.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }

  async isUserRegistered(userId: number) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    return !!user;
  }
}
