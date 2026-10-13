import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';
import { UserRole } from '../constants/roles';
import { AuthenticatedUser } from '../types/express';

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Authentication token is missing');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token has expired');
      }
      throw ApiError.unauthorized('Invalid authentication token');
    }

    // Verify user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        phone: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User associated with token no longer exists');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden(`Your account is ${user.status.toLowerCase()}`);
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      status: user.status,
      phone: user.phone,
    };
    req.user = authUser;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          phone: true,
        },
      });

      if (user && user.status === 'ACTIVE') {
        req.user = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role as UserRole,
          status: user.status,
          phone: user.phone,
        };
      }
    } catch {
      // For optional auth, ignore token verification errors
    }

    next();
  } catch (error) {
    next(error);
  }
};
