import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class UserService {
  constructor(private readonly dbService: DbService) {}

  async getAllUsers() {
    const result = await this.dbService.user.findMany();
    return result.map((user) => ({
      id: user.id,
      email: user.email,
    }));
  }

  async getUserById(userId: number) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  async deleteUser(userId: number) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.dbService.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }

  async isUserRegistered(userId: number) {
    const user = await this.dbService.user.findUnique({
      where: { id: userId },
    });
    return !!user;
  }
}
