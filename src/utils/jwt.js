const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_TOKEN_EXPIRES || 7200; // 2 horas
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_TOKEN_EXPIRES || 604800; // 7 dias

/**
 * Gera um token de acesso JWT
 * @param {Object} payload - Dados do usuário para incluir no token
 * @returns {String} Token JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role
    },
    JWT_SECRET,
    {
      expiresIn: parseInt(ACCESS_TOKEN_EXPIRES),
      issuer: 'nocontrole-api',
      audience: 'nocontrole-app'
    }
  );
};

/**
 * Gera um token de refresh JWT
 * @param {Object} payload - Dados do usuário para incluir no token
 * @returns {String} Refresh token JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      tokenType: 'refresh'
    },
    JWT_SECRET,
    {
      expiresIn: parseInt(REFRESH_TOKEN_EXPIRES),
      issuer: 'nocontrole-api',
      audience: 'nocontrole-app'
    }
  );
};

/**
 * Verifica e decodifica um token JWT
 * @param {String} token - Token JWT para verificar
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'nocontrole-api',
      audience: 'nocontrole-app'
    });
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};

/**
 * Decodifica um token sem verificar a assinatura
 * @param {String} token - Token JWT para decodificar
 * @returns {Object} Payload decodificado
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Token malformado');
  }
};

/**
 * Verifica se um token está expirado
 * @param {String} token - Token JWT para verificar
 * @returns {Boolean} True se expirado, false caso contrário
 */
const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Extrai o token do header Authorization
 * @param {String} authHeader - Header Authorization
 * @returns {String|null} Token extraído ou null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Gera um par de tokens (access e refresh)
 * @param {Object} user - Dados do usuário
 * @returns {Object} Objeto com accessToken e refreshToken
 */
const generateTokenPair = (user) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role
  };
  
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: ACCESS_TOKEN_EXPIRES
  };
};

/**
 * Valida se um refresh token é válido
 * @param {String} refreshToken - Refresh token para validar
 * @returns {Object} Payload decodificado se válido
 */
const validateRefreshToken = (refreshToken) => {
  try {
    const decoded = verifyToken(refreshToken);
    
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Token não é um refresh token');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Refresh token inválido');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeader,
  generateTokenPair,
  validateRefreshToken
};

