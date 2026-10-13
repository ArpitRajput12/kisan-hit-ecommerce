import { Request, Response, NextFunction } from 'express';
import { combosService } from './combos.service';

export class CombosController {
  async getDealerCombos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const combos = await combosService.getDealerCombos(userId);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Dealer combos retrieved successfully',
        data: combos,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDealerCombo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const combo = await combosService.createDealerCombo(userId, req.body);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Treatment combo kit created successfully',
        data: combo,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const comboId = req.params.id as string;
      const { isActive } = req.body;
      const updated = await combosService.updateComboStatus(userId, comboId, isActive);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Combo kit ${isActive ? 'activated' : 'paused'} successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCombo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const comboId = req.params.id as string;
      const result = await combosService.deleteDealerCombo(userId, comboId);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async listDiseases(_req: Request, res: Response, next: NextFunction) {
    try {
      const diseases = await combosService.listDiseases();
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Disease master list retrieved successfully',
        data: diseases,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicCombos(req: Request, res: Response, next: NextFunction) {
    try {
      const { pestDiseaseId, slug } = req.query as { pestDiseaseId?: string; slug?: string };
      const combos = await combosService.getPublicCombos({ pestDiseaseId, slug });
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Public treatment combos retrieved successfully',
        data: combos,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const combosController = new CombosController();

