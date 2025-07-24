const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Middleware para verificar autenticação
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }
    
    // Verificar e decodificar o token
    const decoded = verifyToken(token);
    
    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.id).select('+refreshTokens');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta de usuário desativada'
      });
    }
    
    // Adicionar usuário ao request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware para verificar autorização por role
 * @param {Array} allowedRoles - Roles permitidas
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    if (allowedRoles.length === 0) {
      return next();
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes'
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar se o usuário é o proprietário do recurso
 * @param {String} resourceField - Campo que contém o ID do usuário proprietário
 */
const checkOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    // Se for admin, permitir acesso
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Verificar propriedade baseada no campo especificado
    let resourceUserId;
    
    if (req.params && req.params[resourceField]) {
      resourceUserId = req.params[resourceField];
    } else if (req.body && req.body[resourceField]) {
      resourceUserId = req.body[resourceField];
    } else if (req.query && req.query[resourceField]) {
      resourceUserId = req.query[resourceField];
    }
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário proprietário não fornecido'
      });
    }
    
    if (resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você não tem permissão para acessar este recurso'
      });
    }
    
    next();
  };
};

/**
 * Middleware opcional de autenticação (não falha se não houver token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Ignorar erros de token em autenticação opcional
    next();
  }
};

/**
 * Middleware para verificar se o usuário está ativo
 */
const checkActiveUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }
  
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Conta de usuário desativada'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  checkOwnership,
  optionalAuth,
  checkActiveUser
};

