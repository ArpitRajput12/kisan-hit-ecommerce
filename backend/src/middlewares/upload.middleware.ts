import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

// Ensure the local secure KYC uploads directory exists
const uploadDir = path.resolve(process.cwd(), env.KYC_UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedOriginalName).toLowerCase();
    const baseName = path.basename(sanitizedOriginalName, ext);
    const finalFilename = `kyc_${Date.now()}_${randomHex}_${baseName}${ext}`;
    cb(null, finalFilename);
  },
});

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type: ${file.mimetype}. Allowed types are PDF, JPG, JPEG, and PNG.`
      )
    );
  }
};

export const kycUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per document
  },
  fileFilter,
});

export const kycMultiDocsUpload = kycUpload.fields([
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'formC', maxCount: 1 },             // Seeds License
  { name: 'formO', maxCount: 1 },             // Fertilizer License
  { name: 'pesticideLicense', maxCount: 1 },  // Insecticides/Pesticide License
  { name: 'bankCheque', maxCount: 1 },        // Cancelled Cheque
]);

