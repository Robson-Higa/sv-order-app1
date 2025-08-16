import { NextApiRequest, NextApiResponse } from 'next';

type Middleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) => Promise<void> | void;

export const applyMiddleware =
  (
    middlewares: Middleware[],
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
  ) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const executeMiddleware = async (index: number) => {
      if (index < middlewares.length) {
        await middlewares[index](req, res, () => executeMiddleware(index + 1));
      } else {
        await handler(req, res);
      }
    };

    await executeMiddleware(0);
  };
