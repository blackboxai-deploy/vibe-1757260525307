import { promises as fs } from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface BusinessData {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  value: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');

export class Database {
  private async readFile<T>(filename: string): Promise<T[]> {
    try {
      const filePath = path.join(DATA_DIR, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  }

  private async writeFile<T>(filename: string, data: T[]): Promise<void> {
    try {
      const filePath = path.join(DATA_DIR, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      throw error;
    }
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return this.readFile<User>('users.json');
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.email === email) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = await this.getUsers();
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    await this.writeFile('users.json', users);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const users = await this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.writeFile('users.json', users);
    return users[userIndex];
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.getUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    if (filteredUsers.length === users.length) return false;
    await this.writeFile('users.json', filteredUsers);
    return true;
  }

  // Business data operations
  async getBusinessData(): Promise<BusinessData[]> {
    return this.readFile<BusinessData>('business-data.json');
  }

  async getBusinessDataById(id: string): Promise<BusinessData | null> {
    const data = await this.getBusinessData();
    return data.find(item => item.id === id) || null;
  }

  async getBusinessDataByUserId(userId: string): Promise<BusinessData[]> {
    const data = await this.getBusinessData();
    return data.filter(item => item.userId === userId);
  }

  async createBusinessData(dataEntry: Omit<BusinessData, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessData> {
    const data = await this.getBusinessData();
    const newEntry: BusinessData = {
      ...dataEntry,
      id: `data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.push(newEntry);
    await this.writeFile('business-data.json', data);
    return newEntry;
  }

  async updateBusinessData(id: string, updates: Partial<Omit<BusinessData, 'id' | 'createdAt'>>): Promise<BusinessData | null> {
    const data = await this.getBusinessData();
    const dataIndex = data.findIndex(item => item.id === id);
    if (dataIndex === -1) return null;

    data[dataIndex] = {
      ...data[dataIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.writeFile('business-data.json', data);
    return data[dataIndex];
  }

  async deleteBusinessData(id: string): Promise<boolean> {
    const data = await this.getBusinessData();
    const filteredData = data.filter(item => item.id !== id);
    if (filteredData.length === data.length) return false;
    await this.writeFile('business-data.json', filteredData);
    return true;
  }

  // Session operations
  async getSessions(): Promise<Session[]> {
    return this.readFile<Session>('sessions.json');
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    const sessions = await this.getSessions();
    return sessions.find(session => session.token === token && new Date(session.expiresAt) > new Date()) || null;
  }

  async createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const sessions = await this.getSessions();
    const newSession: Session = {
      ...sessionData,
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    sessions.push(newSession);
    await this.writeFile('sessions.json', sessions);
    return newSession;
  }

  async deleteSession(token: string): Promise<boolean> {
    const sessions = await this.getSessions();
    const filteredSessions = sessions.filter(session => session.token !== token);
    if (filteredSessions.length === sessions.length) return false;
    await this.writeFile('sessions.json', filteredSessions);
    return true;
  }

  async cleanExpiredSessions(): Promise<void> {
    const sessions = await this.getSessions();
    const activeSessions = sessions.filter(session => new Date(session.expiresAt) > new Date());
    await this.writeFile('sessions.json', activeSessions);
  }
}

export const db = new Database();