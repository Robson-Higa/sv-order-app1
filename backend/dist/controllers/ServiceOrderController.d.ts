import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class ServiceOrderController {
    getAllServiceOrders(req: AuthRequest, res: Response): Promise<void>;
    getServiceOrderById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createServiceOrder(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateServiceOrder(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    assignTechnician(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    cancelServiceOrder(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getServiceOrderStats(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=ServiceOrderController.d.ts.map