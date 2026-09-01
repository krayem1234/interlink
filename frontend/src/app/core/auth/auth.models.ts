export type UserRole = 'STUDENT' | 'COMPANY' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AdminUser extends AuthUser {
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
  is_active?: boolean;
  is_blocked?: boolean;
  created_at?: string;
}

export interface PasswordChangeRequest {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  mustChangePassword?: boolean;
  securityQuestionsConfigured?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SecurityQuestionInput {
  question: string;
  answer: string;
}

export interface ChangePasswordPayload {
  email: string;
  currentPassword: string;
  newPassword: string;
  securityQuestions?: SecurityQuestionInput[];
}

export interface RequestPasswordChangePayload {
  userId: string;
  newPassword: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  securityQuestionsConfigured: boolean;
}

export const SECURITY_QUESTION_SUGGESTIONS = [
  'Quel est le nom de votre premier animal ?',
  'Quelle est la ville de naissance de votre mère ?',
  'Quel est le nom de votre école primaire ?',
  'Quel est votre film préféré ?',
  'Quel est le prénom de votre meilleur ami d’enfance ?'
];
