import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { mediaController } from './media.controller';
import { optionalAuthenticate } from '../../middlewares/auth.middleware';
import { ApiError } from '../../utils/apiError';

const router = Router();

const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only JPEG, PNG, and WebP image formats are allowed'));
    }
  },
});

const uploadImageFlex = (req: Request, res: Response, next: NextFunction) => {
  memoryUpload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if ((req as any).files && (req as any).files.length > 0) {
      req.file = (req as any).files[0];
    }
    next();
  });
};

// POST /api/v1/media/upload
router.post('/upload', optionalAuthenticate, uploadImageFlex, mediaController.uploadImage);

export default router;

