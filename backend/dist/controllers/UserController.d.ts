import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class UserController {
    getAllUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUsersByType(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTechnicians(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deactivateUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    activateUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=UserController.d.ts.map