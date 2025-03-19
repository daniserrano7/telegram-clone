import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { DbService } from 'src/db/db.service';
import { mapDbUserToUser } from 'src/user/user.service';
@Injectable()
export class AuthService {
  constructor(private readonly db: DbService) {}

  public validateUsername(username: string): boolean {
    // Must be 3-30 characters long
    if (username.length < 3 || username.length > 30) return false;

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) return false;

    // Can only contain letters, numbers, underscores (_), and dots (.)
    if (!/^[a-zA-Z0-9_.]+$/.test(username)) return false;

    return true;
  }

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
    const dbUser = await this.db.user.create({
      data: {
        username,
        password: hashedPassword,
      },
      omit: {
        password: true,
      },
    });
    const user = mapDbUserToUser(dbUser);
    const token = this.generateToken(dbUser.id);

    return { user, token };
  }

  async login(username: string, password: string) {
    const dbUser = await this.db.user.findUnique({ where: { username } });

    if (!dbUser || !(await bcrypt.compare(password, dbUser.password))) {
      throw new Error('Invalid credentials');
    }

    const user = mapDbUserToUser(dbUser);

    const token = this.generateToken(dbUser.id);
    return { token, user };
  }
}
