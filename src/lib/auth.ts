import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): AuthPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string } | { error: string }> {
    try {
      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return { error: 'User with this email already exists' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await db.createUser({
        email,
        password: hashedPassword,
        name,
        role: 'user',
        isActive: true,
      });

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Create session
      await db.createSession({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      return { user: { ...user, password: '' }, token };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Registration failed' };
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
    try {
      // Find user
      const user = await db.getUserByEmail(email);
      if (!user) {
        return { error: 'Invalid credentials' };
      }

      if (!user.isActive) {
        return { error: 'Account is deactivated' };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return { error: 'Invalid credentials' };
      }

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Create session
      await db.createSession({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      return { user: { ...user, password: '' }, token };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Login failed' };
    }
  }

  async logout(token: string): Promise<boolean> {
    try {
      await db.deleteSession(token);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      // Verify session exists and is valid
      const session = await db.getSessionByToken(token);
      if (!session) {
        return null;
      }

      // Get user data
      const user = await db.getUserById(session.userId);
      if (!user || !user.isActive) {
        return null;
      }

      return { ...user, password: '' };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async requireAuth(token: string): Promise<User | null> {
    const user = await this.getCurrentUser(token);
    return user;
  }

  async requireAdmin(token: string): Promise<User | null> {
    const user = await this.requireAuth(token);
    if (!user || user.role !== 'admin') {
      return null;
    }
    return user;
  }

  // Middleware helper for API routes
  extractTokenFromHeaders(headers: Headers): string | null {
    const authHeader = headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }

  // Extract token from cookies (for browser sessions)
  extractTokenFromCookie(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth-token') {
        return value;
      }
    }
    return null;
  }
}

export const authService = new AuthService();

// Utility function to get user from request
export async function getUserFromRequest(request: Request): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  
  let token: string | null = null;
  
  // Try to get token from Authorization header first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } 
  // Fallback to cookie
  else if (cookieHeader) {
    token = authService.extractTokenFromCookie(cookieHeader);
  }

  if (!token) {
    return null;
  }

  return authService.getCurrentUser(token);
}