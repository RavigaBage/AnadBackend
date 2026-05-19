import { jest, afterEach } from '@jest/globals';

// ✅ Set env vars directly — runs before any module loads
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

afterEach(() => {
  jest.clearAllMocks();
});