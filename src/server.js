const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Importar configurações e middlewares
const connectDB = require('./config/database');
const routes = require('./routes');
const {
  corsConfig,
  helmetConfig,
  mongoSanitizeConfig,
  xssProtection,
  securityHeaders,
  securityLogger,
  apiLimiter
} = require('./middlewares/security');
const {
  notFound,
  errorHandler,
  sanitizeInput,
  requestLogger
} = require('./middlewares/errorHandler');

// Criar aplicação Express
const app = express();

// Conectar ao banco de dados
connectDB();

// Middlewares de segurança
app.use(helmetConfig);
app.use(corsConfig);
app.use(securityHeaders);
app.use(securityLogger);

// Middlewares básicos
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middlewares de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(requestLogger);

// Middlewares de sanitização
app.use(mongoSanitizeConfig);
app.use(xssProtection);
app.use(sanitizeInput);

// Rate limiting
app.use('/api', apiLimiter);

// Rotas principais
app.use('/api', routes);
app.use('/health', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API NoControle - Sistema Financeiro',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// Middleware para rotas não encontradas
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Configuração da porta
const PORT = process.env.PORT || 3000;

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Servidor NoControle iniciado!
📍 Ambiente: ${process.env.NODE_ENV || 'development'}
🌐 URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
📚 API: http://localhost:${PORT}/api
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Promise rejeitada não tratada:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;

