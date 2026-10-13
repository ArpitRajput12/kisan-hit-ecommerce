import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import { logger } from '../../utils/logger';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class MediaService {
  async uploadImage(
    buffer: Buffer,
    folder: string = 'kisan-hit/products'
  ): Promise<{ url: string; secureUrl: string; publicId: string }> {
    if (!env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME === 'agri_mock_cloud') {
      logger.warn('Cloudinary credentials missing or using mock cloud name');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            logger.error('Cloudinary upload error:', error);
            return reject(
              ApiError.internal(
                error?.message || 'Failed to upload image to Cloudinary CDN'
              )
            );
          }

          resolve({
            url: result.secure_url || result.url,
            secureUrl: result.secure_url || result.url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }
}

export const mediaService = new MediaService();

