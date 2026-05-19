import { describe, it, expect } from '@jest/globals';

// ✅ Dynamic import AFTER env vars are set by setup
const { generateAccessToken, generateRefreshToken, verifyToken } =
  await import('../utils/jwt/auth.token.js');

const mockPayload = { userId: 'cuid123', email: 'test@example.com', role: 'user' };

describe('JWT Utilities', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify and return payload from a valid token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should throw on an invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });

    it('should throw on a tampered token', () => {
      const token = generateAccessToken(mockPayload);
      const tampered = token.slice(0, -5) + 'xxxxx';
      expect(() => verifyToken(tampered)).toThrow();
    });
  });
});