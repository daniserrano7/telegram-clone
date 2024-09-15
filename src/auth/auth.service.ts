// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { DbService } from 'src/db/db.service';

@Injectable()
export class AuthService {
  constructor(private readonly db: DbService) {}

  generateToken(userId: number) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  }

  async register(email: string, password: string) {
    const existingUser = await this.db.user.findUnique({
      where: { email },
    });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.db.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    const token = this.generateToken(newUser.id);
    return { user: newUser, token };
  }

  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);
    return { token, user };
  }
}
