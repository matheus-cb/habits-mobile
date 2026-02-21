export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checkin {
  id: string;
  habitId: string;
  date: string;
  createdAt: string;
}

export interface HabitStats {
  totalCheckins: number;
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
