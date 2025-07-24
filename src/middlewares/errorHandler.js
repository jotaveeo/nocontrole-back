const mongoose = require('mongoose');

/**
 * Middleware para tratamento de erros 404
 */
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Middleware principal de tratamento de erros
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message: `Dados inválidos: ${message}`,
      status: 400
    };
  }

  // Erro de cast do Mongoose (ID inválido)
  if (err.name === 'CastError') {
    error = {
      message: 'Recurso não encontrado',
      status: 404
    };
  }

  // Erro de duplicação (chave única)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = {
      message: `${field} '${value}' já está em uso`,
      status: 400
    };
  }

  // Erro de ObjectId inválido
  if (err instanceof mongoose.Error.CastError) {
    error = {
      message: 'ID inválido',
      status: 400
    };
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Token inválido',
      status: 401
    };
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expirado',
      status: 401
    };
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = {
      message: 'JSON inválido',
      status: 400
    };
  }

  // Erro de limite de tamanho do payload
  if (err.type === 'entity.too.large') {
    error = {
      message: 'Arquivo muito grande',
      status: 413
    };
  }

  // Erro de conexão com o banco de dados
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = {
      message: 'Erro de conexão com o banco de dados',
      status: 503
    };
  }

  // Erro de rate limiting
  if (err.status === 429) {
    error = {
      message: 'Muitas tentativas. Tente novamente mais tarde.',
      status: 429
    };
  }

  const response = {
    success: false,
    message: error.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        stack: err.stack,
        details: err
      }
    })
  };

  res.status(error.status || 500).json(response);
};

/**
 * Middleware para capturar erros assíncronos
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware para validar se o recurso pertence ao usuário
 */
const validateOwnership = (model, resourceField = 'user') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params.id;
    const userId = req.user._id;

    const resource = await model.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Recurso não encontrado'
      });
    }

    if (resource[resourceField].toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você não tem permissão para acessar este recurso'
      });
    }

    req.resource = resource;
    next();
  });
};

/**
 * Middleware para validar se o usuário existe
 */
const validateUserExists = (userRepository) => {
  return asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    
    const user = await userRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Conta de usuário desativada'
      });
    }

    next();
  });
};

/**
 * Middleware para validar dados obrigatórios
 */
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    fields.forEach(field => {
      if (field.includes('.')) {
        // Campo aninhado (ex: 'user.name')
        const parts = field.split('.');
        let value = req.body;
        
        for (const part of parts) {
          value = value?.[part];
        }
        
        if (value === undefined || value === null || value === '') {
          missingFields.push(field);
        }
      } else {
        // Campo simples
        if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
          missingFields.push(field);
        }
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não fornecidos',
        missingFields
      });
    }

    next();
  };
};

/**
 * Middleware para sanitizar dados de entrada
 */
const sanitizeInput = (req, res, next) => {
  // Remover campos que começam com $ (proteção contra NoSQL injection)
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);

  next();
};

/**
 * Middleware para log de requisições
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id || 'anonymous'
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', logData);
    }
  });

  next();
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  validateOwnership,
  validateUserExists,
  validateRequiredFields,
  sanitizeInput,
  requestLogger
};

