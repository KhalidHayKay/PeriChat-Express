import express from 'express';

import routes from './routes/index.js';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { errorHandler } from './errors/error.js';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.cors.origins,
    credentials: true,
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(compression({ threshold: 1024 }));

app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
