import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

jest.unstable_mockModule('../db/prisma.js', () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

const { default: prisma } = await import('../db/prisma.js');
const { generateAccessToken } = await import('../utils/jwt/auth.token.js');

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

let app: express.Express;

beforeAll(async () => {
  const { default: authRoutes } = await import('../routes/auth.routes.js');
  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
});

describe('POST /api/auth/register', () => {
  it('should register a new user and return accessToken', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null as never);
    mockPrisma.user.create.mockResolvedValue({
      id: 'cuid123',
      name: 'Test User',
      email: 'test@example.com',
    } as never);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body).not.toHaveProperty('refreshToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 409 if email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'cuid123',
      email: 'test@example.com',
    } as never);

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'Email already in use');
  });

  it('should return 400 if email or password is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'No Password',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Email and password are required');
  });
});

describe('POST /api/auth/login', () => {
  it('should login and return accessToken with cookie', async () => {
    const hashed = await bcrypt.hash('password123', 12);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'cuid123',
      name: 'Test User',
      email: 'test@example.com',
      password: hashed,
    } as never);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const hashed = await bcrypt.hash('correctpassword', 12);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'cuid123',
      email: 'test@example.com',
      password: hashed,
    } as never);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('should return 401 if user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null as never);

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });
});

describe('POST /api/auth/refresh', () => {
  it('should return 401 if no refresh token cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Refresh token missing');
  });
});

describe('POST /api/auth/logout', () => {
  it('should clear the cookie on logout', async () => {
    const token = generateAccessToken({
      userId: 'cuid123',
      email: 'test@example.com',
      role: 'user',
    });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(Array.isArray(cookies)).toBe(true);
    expect(cookies[0]).toMatch(/refreshToken=;/);
  });
});