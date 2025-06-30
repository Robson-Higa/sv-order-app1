import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class EstablishmentController {
    getAllEstablishments(req: AuthRequest, res: Response): Promise<void>;
    getEstablishmentById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createEstablishment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateEstablishment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteEstablishment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deactivateEstablishment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    activateEstablishment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getEstablishmentStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=EstablishmentController.d.ts.map