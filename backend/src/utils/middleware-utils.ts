import { NextApiRequest, NextApiResponse } from 'next';

type Middleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void | Promise<void>
) => void | Promise<void>;

export const applyMiddleware =
  (
    middlewares: Middleware[],
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
  ) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const executeMiddleware = async (index: number): Promise<void> => {
      if (index < middlewares.length) {
        try {
          await middlewares[index](req, res, () => executeMiddleware(index + 1));
        } catch (err: any) {
          console.error('Middleware error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: err.message || 'Erro interno' });
          }
        }
      } else {
        await handler(req, res);
      }
    };

    await executeMiddleware(0);
  };
