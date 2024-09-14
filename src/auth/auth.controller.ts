import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const authService = new AuthService();

  try {
    const user = await authService.register(email, password);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server internal error' });
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const authService = new AuthService();

  try {
    const { token, user } = await authService.login(email, password);
    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

export const authController = {
  register,
  login,
};
