import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare class AuthController {
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    registerAdmin(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    registerTechnician(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    changePassword(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    forgotPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    resetPassword(req: Request, res: Response): Promise<void>;
    logout(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map