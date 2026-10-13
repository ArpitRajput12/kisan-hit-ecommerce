export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
  BUYER: 'BUYER',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.SELLER,
  ROLES.BUYER,
];

export const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
export const SELLER_AND_ADMIN_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.SELLER,
];
