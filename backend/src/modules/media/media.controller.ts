import { Request, Response } from 'express';
import { mediaService } from './media.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';

export class MediaController {
  uploadImage = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest('No image file provided in upload request');
    }

    const folder = (req.body?.folder as string) || 'kisan-hit/products';
    const uploadResult = await mediaService.uploadImage(file.buffer, folder);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Photo uploaded successfully to Cloudinary / फोटो सफलतापूर्वक अपलोड हो गई!',
      data: {
        url: uploadResult.secureUrl,
        imageUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
      },
      url: uploadResult.secureUrl,
      imageUrl: uploadResult.secureUrl,
    });
  });
}

export const mediaController = new MediaController();

