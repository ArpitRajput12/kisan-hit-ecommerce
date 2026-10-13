import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { UserRole } from '../constants/roles';
import { Permission, hasPermission } from '../constants/permissions';
import { prisma } from '../config/prisma';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Requires one of roles: [${roles.join(', ')}]`
        )
      );
    }

    next();
  };
};

export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const hasAll = permissions.every((p) => hasPermission(req.user!.role, p));
    if (!hasAll) {
      return next(
        ApiError.forbidden(
          `Access denied. Requires permissions: [${permissions.join(', ')}]`
        )
      );
    }

    next();
  };
};

export const requireApprovedSeller = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Admins and Super Admins bypass seller KYC approval check
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role !== 'SELLER') {
      return next(ApiError.forbidden('Only sellers can perform this action'));
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!sellerProfile) {
      return next(
        ApiError.forbidden('Seller profile not found. Please complete seller registration.')
      );
    }

    if (sellerProfile.kycStatus !== 'APPROVED') {
      return next(
        ApiError.forbidden(
          `Seller KYC is currently ${sellerProfile.kycStatus.toLowerCase()}. Only approved sellers can list products or manage inventory.`
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
