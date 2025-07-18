import { config } from 'dotenv';

// Load environment variables
config({ path: './e2e/.env' });

interface UserResponse {
  token: string;
  user: { id: number };
}

interface ChatResponse {
  id: number;
  members: Array<{ id: number }>;
  messages: Array<{ id: number; content: string }>;
}

const API_URL = process.env.E2E_API_URL || 'http://localhost:3000';

export async function registerUser(
  username: string,
  password: string
): Promise<UserResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, confirmPassword: password }),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
  return res.json() as Promise<UserResponse>;
}

export async function loginUser(
  username: string,
  password: string
): Promise<UserResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json() as Promise<UserResponse>;
}

export async function createChat(
  token: string,
  userIds: number[],
  content: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userIds, content }),
  });
  if (!res.ok) throw new Error(`Create chat failed: ${res.status}`);
  return res.json() as Promise<ChatResponse>;
}
