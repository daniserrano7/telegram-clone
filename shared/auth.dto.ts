import { type User } from './user.dto';

export type SwapDatesWithStrings<T> = {
  [k in keyof T]: T[k] extends Date
    ? string
    : T[k] extends object
      ? SwapDatesWithStrings<T[k]>
      : T[k];
};

export interface RegisterRequestDto {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponseDto {
  user: User;
  token: string;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  user: User;
  token: string;
}

export type ErrorResponseDto = { error: string };
