import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  registerSchema,
  registerFarmerProfileSchema,
  googleAuthSchema,
  completeFarmerProfileSchema,
  completeDealerProfileSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  adminLoginSchema,
} from './auth.validation';

const router = Router();

// Standard Registration & Login
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/admin-login', validateRequest(adminLoginSchema), authController.adminLogin);

// Google Sign-In & Email Verification
router.post('/google', validateRequest(googleAuthSchema), authController.googleAuth);
router.post('/farmer/register-profile', validateRequest(registerFarmerProfileSchema), authController.registerFarmerProfile);

// Passwordless Farmer & Dealer Profile Completion
router.post(
  '/farmer/complete-profile',
  authenticate,
  validateRequest(completeFarmerProfileSchema),
  authController.completeFarmerProfile
);
router.post(
  '/dealer/complete-profile',
  authenticate,
  validateRequest(completeDealerProfileSchema),
  authController.completeDealerProfile
);

// Mobile OTP Authentication (Support both /otp/send and /send-otp routes)
router.post('/otp/send', validateRequest(sendOtpSchema), authController.sendOtp);
router.post('/send-otp', validateRequest(sendOtpSchema), authController.sendOtp);
router.post('/otp/verify', validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post('/verify-otp', validateRequest(verifyOtpSchema), authController.verifyOtp);

// Token Refresh
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);

// Profile
router.get('/me', authenticate, authController.getProfile);
router.patch('/me', authenticate, validateRequest(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), authController.changePassword);

export default router;
