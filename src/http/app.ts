import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import type { ErrorBody } from '../contract/index.js';
import { handlePaths } from './paths.js';
import { handleReachability } from './reachability.js';
import { handleRecommendations } from './recommendations.js';

const malformedJsonBody: ErrorBody = {
  error: { type: 'malformed_request', issues: [{ path: '', message: 'invalid JSON body' }] },
}

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.post('/v1/recommendations', (req: Request, res: Response) => {
    const { status, body } = handleRecommendations(req.body);
    res.status(status).json(body);
  });

  app.post('/v1/paths', (req: Request, res: Response) => {
    const { status, body } = handlePaths(req.body);
    res.status(status).json(body);
  });

  app.post('/v1/reachability', (req: Request, res: Response) => {
    const { status, body } = handleReachability(req.body);
    res.status(status).json(body);
  });

  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json(malformedJsonBody);
  });

  return app;
}
