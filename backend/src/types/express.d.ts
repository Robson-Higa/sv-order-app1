import { AuthenticatedUser } from '../interfaces/AuthenticatedUser';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
