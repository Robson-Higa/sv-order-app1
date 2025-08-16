import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Importar rotas
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import establishmentRoutes from './routes/establishments';
import serviceOrderRoutes from './routes/serviceOrders';
import dashboardRoutes from './routes/dashboard';
import tokenRoutes from './routes/auth';
import reportRoutes from './routes/report';
import titleRoutes from './routes/titles';
import sectorRoutes from './routes/sectors';
import whatsappRoutes from './routes/whatsappRoutes';
import { ServiceOrderController } from './controllers/ServiceOrderController';
import publicRoutes from './routes/publicRoutes';

import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000; // Changed default port to 3001 to avoid conflict

const serviceOrderController = new ServiceOrderController();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configurado para permitir acesso do frontend
app.use(
  cors({
    origin: 'http://localhost:5173', // ou '*' para liberar geral (não recomendado em produção)
    credentials: true,
  })
);

app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
//public routes
app.use('/api', publicRoutes);

//app.use('/api/auth', tokenRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api/service-orders', serviceOrderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api', sectorRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Rota de health check
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

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

//app.post('/api/service-orders/update-lowercase', serviceOrderController.updateAllServiceOrdersHandler);

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

export default app;
