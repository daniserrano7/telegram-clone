import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/db';

export class AuthService {
  generateToken(userId: number) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
      expiresIn: '1d',
    });
  }

  async register(email: string, password: string) {
    if (!email || !password) throw new Error('Email and password are required');

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    const token = this.generateToken(newUser.id);

    return { user: { id: newUser.id, email: newUser.email }, token };
  }

  async login(email: string, password: string) {
    if (!email || !password) throw new Error('Email and password are required');

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);

    return { token, user };
  }
}
