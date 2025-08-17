import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import establishmentRoutes from './routes/establishments';
import serviceOrderRoutes from './routes/serviceOrders';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/report';
import titleRoutes from './routes/titles';
import sectorRoutes from './routes/sectors';
import whatsappRoutes from './routes/whatsappRoutes';
import publicRoutes from './routes/publicRoutes';
import { ServiceOrderController } from './controllers/ServiceOrderController';

import { VercelRequest, VercelResponse } from '@vercel/node';

dotenv.config();

const app = express();
const serviceOrderController = new ServiceOrderController();

const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / apps móveis
      if (allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('CORS não permitido para este origin: ' + origin));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging em dev
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rotas públicas
app.use('/api', publicRoutes);

// Rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api/service-orders', serviceOrderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api', sectorRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'API do Sistema de Gestão de Ordens de Serviço',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      establishments: '/api/establishments',
      serviceOrders: '/api/service-orders',
      dashboard: '/api/dashboard',
      health: '/health',
    },
  });
});

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  if (err) {
    return res.status(err?.status || 500).json({
      error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err?.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err?.stack }),
    });
  }

  return next();
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de cache-control
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Opcional: endpoint para atualizar service orders em lowercase
// app.post('/api/service-orders/update-lowercase', serviceOrderController.updateAllServiceOrdersHandler);

// Somente para dev local: iniciar servidor tradicional
if (process.env.NODE_ENV !== 'production') {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
  });
}

// Export serverless para Vercel
export default (req: VercelRequest, res: VercelResponse) => app(req, res);
