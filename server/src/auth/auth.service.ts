import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { DbService } from 'src/db/db.service';

@Injectable()
export class AuthService {
  constructor(private readonly db: DbService) {}

  generateToken(userId: number) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '365d',
    }) as string;
  }

  async register({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) {
    const existingUser = await this.db.user.findFirst({
      where: { username },
    });

    if (existingUser)
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.db.user.create({
      data: {
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
    const token = this.generateToken(user.id);
    return { user, token };
  }

  async login(username: string, password: string) {
    const user = await this.db.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const userWithouthPassword = {
      id: user.id,
      onlineStatus: user.onlineStatus,
      lastConnection: user.lastConnection,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };

    const token = this.generateToken(user.id);
    return { token, user: userWithouthPassword };
  }
}
