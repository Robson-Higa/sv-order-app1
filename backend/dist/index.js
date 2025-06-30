"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const establishments_1 = __importDefault(require("./routes/establishments"));
const serviceOrders_1 = __importDefault(require("./routes/serviceOrders"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/establishments', establishments_1.default);
app.use('/api/service-orders', serviceOrders_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
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
            health: '/health'
        }
    });
});
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido' });
    }
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map