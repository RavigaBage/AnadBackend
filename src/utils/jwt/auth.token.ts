import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { config } from '../../config/env.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role?:string;
}

const accessTokenOptions: SignOptions = { expiresIn: '15m' as const };
const refreshTokenOptions: SignOptions = { expiresIn: '7d' as const };

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, accessTokenOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, refreshTokenOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};