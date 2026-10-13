import { Request, Response, NextFunction } from 'express';
import { remediesService } from './remedies.service';
import { ApiResponse } from '../../utils/apiResponse';

export class RemediesController {
  async listPestsAndDiseases(_req: Request, res: Response, next: NextFunction) {
    try {
      const pests = await remediesService.listPestsAndDiseases();
      ApiResponse.success(res, 'Crop pests and diseases retrieved successfully', pests, 200);
    } catch (err) {
      next(err);
    }
  }

  async getPestBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const pest = await remediesService.getPestBySlug(req.params.slug as string);
      ApiResponse.success(res, 'Pest remedy and treatment combo details retrieved', pest, 200);
    } catch (err) {
      next(err);
    }
  }

  async createPest(req: Request, res: Response, next: NextFunction) {
    try {
      const pest = await remediesService.createPest(req.body);
      ApiResponse.created(res, 'Pest disease guide entry created successfully', pest);
    } catch (err) {
      next(err);
    }
  }

  async createTreatmentCombo(req: Request, res: Response, next: NextFunction) {
    try {
      const combo = await remediesService.createTreatmentCombo(req.params.id as string, req.body);
      ApiResponse.created(res, 'Treatment combo pack created successfully', combo);
    } catch (err) {
      next(err);
    }
  }
}

export const remediesController = new RemediesController();

