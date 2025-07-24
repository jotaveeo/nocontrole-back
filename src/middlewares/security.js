const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Rate limiting para autenticação
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limiting em desenvolvimento
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Rate limiting geral para API
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limiting em desenvolvimento
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Rate limiting para upload de arquivos
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 uploads por IP por hora
  message: {
    success: false,
    message: 'Muitos uploads. Tente novamente em 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Configuração do Helmet para segurança
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Middleware para sanitização contra NoSQL injection
 */
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Tentativa de NoSQL injection detectada: ${key} em ${req.originalUrl}`);
  }
});

/**
 * Middleware para proteção XSS
 */
const xssProtection = (req, res, next) => {
  // Sanitizar strings no body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = xss(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    sanitizeObject(req.body);
  }

  // Sanitizar query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    }
  }

  next();
};

/**
 * Middleware para validação de Content-Type
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    // Permitir JSON e multipart/form-data
    if (!contentType || 
        (!contentType.includes('application/json') && 
         !contentType.includes('multipart/form-data'))) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type deve ser application/json ou multipart/form-data'
      });
    }
  }
  next();
};

/**
 * Middleware para validação de User-Agent
 */
const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    return res.status(400).json({
      success: false,
      message: 'User-Agent é obrigatório'
    });
  }

  // Bloquear user agents suspeitos
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && process.env.NODE_ENV === 'production') {
    console.warn(`User-Agent suspeito bloqueado: ${userAgent} - IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'Acesso negado'
    });
  }

  next();
};

/**
 * Middleware para log de segurança
 */
const securityLogger = (req, res, next) => {
  const securityHeaders = {
    'X-Real-IP': req.get('X-Real-IP'),
    'X-Forwarded-For': req.get('X-Forwarded-For'),
    'User-Agent': req.get('User-Agent'),
    'Referer': req.get('Referer'),
    'Origin': req.get('Origin')
  };

  // Log de tentativas de acesso suspeitas
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /vbscript:/i,  // VBScript injection
    /onload=/i,  // Event handler injection
    /onerror=/i  // Event handler injection
  ];

  const url = req.originalUrl;
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || 
    pattern.test(JSON.stringify(req.body)) ||
    pattern.test(JSON.stringify(req.query))
  );

  if (isSuspicious) {
    console.warn('Tentativa de ataque detectada:', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      headers: securityHeaders,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Middleware para CORS personalizado
 */
const corsConfig = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Middleware para adicionar headers de segurança personalizados
 */
const securityHeaders = (req, res, next) => {
  // Remover header que expõe tecnologia
  res.removeHeader('X-Powered-By');
  
  // Headers de segurança adicionais
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  helmetConfig,
  mongoSanitizeConfig,
  xssProtection,
  validateContentType,
  validateUserAgent,
  securityLogger,
  corsConfig,
  securityHeaders
};

