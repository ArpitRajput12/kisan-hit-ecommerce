import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export class FileService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.KYC_UPLOAD_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getSafeFilePath(fileName: string): string {
    // Prevent directory traversal attacks
    const sanitizedFileName = path.basename(fileName);
    const resolvedPath = path.resolve(this.baseDir, sanitizedFileName);

    if (!resolvedPath.startsWith(this.baseDir)) {
      throw ApiError.badRequest('Invalid file path or unauthorized traversal attempt');
    }

    return resolvedPath;
  }

  fileExists(fileName: string): boolean {
    const filePath = this.getSafeFilePath(fileName);
    return fs.existsSync(filePath);
  }

  getFileStats(fileName: string): fs.Stats {
    const filePath = this.getSafeFilePath(fileName);
    if (!fs.existsSync(filePath)) {
      throw ApiError.notFound('Requested document was not found on server storage');
    }
    return fs.statSync(filePath);
  }

  streamSecureDocument(fileName: string, res: Response, download: boolean = false): void {
    const filePath = this.getSafeFilePath(fileName);

    if (!fs.existsSync(filePath)) {
      throw ApiError.notFound('Requested document does not exist in local secure storage');
    }

    const ext = path.extname(fileName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };

    const contentType = mimeMap[ext] || 'application/octet-stream';
    const disposition = download ? 'attachment' : 'inline';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      logger.error(`Error streaming file ${fileName}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to read document' });
      }
    });

    stream.pipe(res);
  }

  deleteFile(fileName: string): boolean {
    try {
      const filePath = this.getSafeFilePath(fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (err) {
      logger.error(`Failed to delete file ${fileName}:`, err);
      return false;
    }
  }
}

export const fileService = new FileService();

