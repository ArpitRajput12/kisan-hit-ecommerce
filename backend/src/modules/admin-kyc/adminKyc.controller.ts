import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { fileService } from '../../services/file.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/apiError';
import { logger } from '../../utils/logger';

export class AdminKycController {
  /**
   * Upload single KYC document to local private storage
   */
  uploadSingleDoc = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest('No document file was uploaded');
    }

    const { docType } = req.body; // e.g. "gstCertificate", "formC", "formO", "pesticideLicense", "bankCheque"
    const fileName = req.file.filename;

    // Link file to seller's profile if user session is present
    if (req.user) {
      const updateData: any = {};
      if (docType === 'gstCertificate') updateData.gstCertificateDoc = fileName;
      else if (docType === 'formC') updateData.formCDoc = fileName;
      else if (docType === 'formO') updateData.formODoc = fileName;
      else if (docType === 'pesticideLicense') updateData.pesticideLicenseDoc = fileName;
      else if (docType === 'bankCheque') updateData.bankChequeDoc = fileName;

      if (Object.keys(updateData).length > 0) {
        await prisma.sellerProfile.upsert({
          where: { userId: req.user.id },
          create: {
            userId: req.user.id,
            businessName: `${req.user.fullName}'s Farm Store`,
            ...updateData,
          },
          update: updateData,
        });
      }
    }

    return ApiResponse.success(res, 'KYC document uploaded successfully to secure server storage', {
      fileName,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      docType: docType || 'general',
    });
  });

  /**
   * Upload multi dealer documents at once (Form C, Form O, Pesticide License, GST, Bank Cheque)
   */
  uploadMultiDocs = asyncHandler(async (req: Request, res: Response) => {

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (!files || Object.keys(files).length === 0) {
      throw ApiError.badRequest('No files uploaded');
    }

    const updateData: any = {};
    const uploadedDocs: Record<string, string> = {};

    if (files.gstCertificate?.[0]) {
      updateData.gstCertificateDoc = files.gstCertificate[0].filename;
      uploadedDocs.gstCertificate = files.gstCertificate[0].filename;
    }
    if (files.formC?.[0]) {
      updateData.formCDoc = files.formC[0].filename;
      uploadedDocs.formC = files.formC[0].filename;
    }
    if (files.formO?.[0]) {
      updateData.formODoc = files.formO[0].filename;
      uploadedDocs.formO = files.formO[0].filename;
    }
    if (files.pesticideLicense?.[0]) {
      updateData.pesticideLicenseDoc = files.pesticideLicense[0].filename;
      uploadedDocs.pesticideLicense = files.pesticideLicense[0].filename;
    }
    if (files.bankCheque?.[0]) {
      updateData.bankChequeDoc = files.bankCheque[0].filename;
      uploadedDocs.bankCheque = files.bankCheque[0].filename;
    }

    if (req.user && Object.keys(updateData).length > 0) {
      await prisma.sellerProfile.upsert({
        where: { userId: req.user.id },
        create: {
          userId: req.user.id,
          businessName: `${req.user.fullName}'s Farm Store`,
          ...updateData,
        },
        update: updateData,
      });
    }

    return ApiResponse.success(res, 'All dealer KYC documents uploaded successfully', uploadedDocs);
  });

  /**
   * Protected Stream/Download Endpoint for Super Admin ONLY
   * Strictly verifies SUPER_ADMIN role before streaming file from private storage
   */
  streamDocument = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Role check: Only SUPER_ADMIN is permitted to view/stream confidential dealer documents
    if (req.user.role !== 'SUPER_ADMIN') {
      logger.warn(`🚨 Unauthorized attempt to access KYC document by user ${req.user.id} (${req.user.role})`);
      throw ApiError.forbidden('Access denied. Confidential dealer documents can only be viewed by Super Admin.');
    }

    const { fileId } = req.params;
    if (!fileId) {
      throw ApiError.badRequest('File ID parameter required');
    }

    logger.info(`📄 [KYC Document Stream] Super Admin ${req.user.email} accessing document: ${fileId}`);
    const download = req.query.download === 'true';
    fileService.streamSecureDocument(fileId as string, res, download);
  });

  /**
   * Submit complete dealer onboarding profile with license expiry date
   */
  submitDealerKyc = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const {
      businessName,
      gstin,
      panNumber,
      farmOrStoreLocation,
      licenseExpiryDate,
      gstCertificateDoc,
      formCDoc,
      formODoc,
      pesticideLicenseDoc,
      bankChequeDoc,
    } = req.body;

    const profile = await prisma.sellerProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        businessName,
        gstin,
        panNumber,
        farmOrStoreLocation,
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
        gstCertificateDoc,
        formCDoc,
        formODoc,
        pesticideLicenseDoc,
        bankChequeDoc,
        kycStatus: 'PENDING',
      },
      update: {
        businessName,
        gstin,
        panNumber,
        farmOrStoreLocation,
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
        ...(gstCertificateDoc ? { gstCertificateDoc } : {}),
        ...(formCDoc ? { formCDoc } : {}),
        ...(formODoc ? { formODoc } : {}),
        ...(pesticideLicenseDoc ? { pesticideLicenseDoc } : {}),
        ...(bankChequeDoc ? { bankChequeDoc } : {}),
        kycStatus: 'PENDING',
        rejectionReason: null,
      },
    });

    return ApiResponse.success(res, 'Dealer KYC application submitted for Super Admin review', profile);
  });
}

export const adminKycController = new AdminKycController();

