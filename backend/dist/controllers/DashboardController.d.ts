import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class DashboardController {
    getDashboardData(req: AuthRequest, res: Response): Promise<void | Response<any, Record<string, any>>>;
    private getAdminDashboard;
    private getTechnicianDashboard;
    private getEndUserDashboard;
    getReports(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=DashboardController.d.ts.map