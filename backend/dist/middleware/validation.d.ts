import { Request, Response, NextFunction } from 'express';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateLogin: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const validateRegister: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const validateServiceOrder: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const validateEstablishment: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const validateFeedback: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
//# sourceMappingURL=validation.d.ts.map