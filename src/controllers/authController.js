const authService = require('../services/authService');
const { validationResult } = require('express-validator');

class AuthController {
  /**
   * Registra um novo usuário
   */
  async register(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const { name, email, password } = req.body;
      
      const result = await authService.register({ name, email, password });
      
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: result.user,
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + result.tokens.expiresIn
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  /**
   * Autentica um usuário
   */
  async login(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const { email, senha } = req.body;
      
      const result = await authService.login(email, senha || req.body.password);
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result.user,
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + result.tokens.expiresIn
      });
      
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  /**
   * Renova tokens de acesso
   */
  async refresh(req, res) {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token é obrigatório'
        });
      }
      
      const result = await authService.refreshTokens(refresh_token);
      
      res.json({
        success: true,
        message: 'Tokens renovados com sucesso',
        data: result.user,
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + result.tokens.expiresIn
      });
      
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  /**
   * Faz logout do usuário
   */
  async logout(req, res) {
    try {
      const { refresh_token } = req.body;
      const userId = req.user._id;
      
      const result = await authService.logout(userId, refresh_token);
      
      res.json({
        success: true,
        message: result.message
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  /**
   * Faz logout de todos os dispositivos
   */
  async logoutAll(req, res) {
    try {
      const userId = req.user._id;
      
      const result = await authService.logoutAll(userId);
      
      res.json({
        success: true,
        message: result.message
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  /**
   * Altera a senha do usuário
   */
  async changePassword(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;
      
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: result.message
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  /**
   * Solicita reset de senha
   */
  async requestPasswordReset(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const { email } = req.body;
      
      const result = await authService.requestPasswordReset(email);
      
      res.json({
        success: true,
        message: result.message
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  /**
   * Retorna informações do usuário autenticado
   */
  async me(req, res) {
    try {
      const user = req.user.toJSON();
      
      res.json({
        success: true,
        data: user
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  
  /**
   * Verifica se o token é válido
   */
  async verifyToken(req, res) {
    try {
      const userId = req.user._id;
      
      const user = await authService.validateUser(userId);
      
      res.json({
        success: true,
        message: 'Token válido',
        data: user
      });
      
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new AuthController();

