import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Response, NextFunction } from 'express';

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

const { authenticate } = await import('../middleware/auth.js');
const { isAdmin } = await import('../middleware/isAdmin.js');
const { generateAccessToken } = await import('../utils/jwt/auth.token.js');
const { default: prisma } = await import('../db/prisma.js');

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

let mockNext: jest.Mock;
beforeEach(() => {
  mockNext = jest.fn();
});

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res) as any;
  res.json = jest.fn().mockReturnValue(res) as any;
  return res;
};

const mockReq = (token?: string) =>
  ({
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
  } as any);

describe('authenticate middleware', () => {
  it('should return 401 if no token is provided', () => {
    const req = mockReq();
    const res = mockRes();
    authenticate(req, res, mockNext as unknown as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
  });

  it('should return 401 if token is invalid', () => {
    const req = mockReq('bad-token');
    const res = mockRes();
    authenticate(req, res, mockNext as unknown as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('should call next() with a valid token', () => {
    const token = generateAccessToken({
      userId: 'cuid123',
      email: 'test@example.com',
      role: 'user',
    });
    const req = mockReq(token);
    const res = mockRes();
    authenticate(req, res, mockNext as unknown as NextFunction);
    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.email).toBe('test@example.com');
  });
});

describe('isAdmin middleware', () => {
  it('should return 403 if user is not admin', async () => {
    const token = generateAccessToken({
      userId: 'cuid123',
      email: 'user@example.com',
      role: 'user',
    });
    const req = mockReq(token);
    const res = mockRes();

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'cuid123',
      email: 'user@example.com',
      role: 'user',
    } as never);

    await isAdmin(req, res, mockNext as unknown as NextFunction);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Admins only.' });
  });

  it('should call next() if user is admin', async () => {
    const token = generateAccessToken({
      userId: 'cuid123',
      email: 'admin@example.com',
      role: 'admin',
    });
    const req = mockReq(token);
    const res = mockRes();

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'cuid123',
      email: 'admin@example.com',
      role: 'admin',
    } as never);

    await isAdmin(req, res, mockNext as unknown as NextFunction);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 if user not found', async () => {
    const token = generateAccessToken({
      userId: 'ghost',
      email: 'ghost@example.com',
      role: 'user',
    });
    const req = mockReq(token);
    const res = mockRes();

    mockPrisma.user.findUnique.mockResolvedValue(null as never);

    await isAdmin(req, res, mockNext as unknown as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });
});