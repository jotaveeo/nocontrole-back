const { User } = require('../models');
const { generateTokenPair, validateRefreshToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

class AuthService {
  /**
   * Registra um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Object} Usuário criado e tokens
   */
  async register(userData) {
    const { name, email, password } = userData;
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email já está em uso');
    }
    
    // Criar novo usuário
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });
    
    await user.save();
    
    // Gerar tokens
    const tokens = generateTokenPair(user);
    
    // Salvar refresh token no usuário
    user.refreshTokens.push({
      token: tokens.refreshToken
    });
    await user.save();
    
    return {
      user: user.toJSON(),
      tokens
    };
  }
  
  /**
   * Autentica um usuário
   * @param {String} email - Email do usuário
   * @param {String} password - Senha do usuário
   * @returns {Object} Usuário e tokens
   */
  async login(email, password) {
    // Buscar usuário com senha
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password +refreshTokens');
    
    if (!user) {
      throw new Error('Credenciais inválidas');
    }
    
    if (!user.isActive) {
      throw new Error('Conta desativada');
    }
    
    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }
    
    // Gerar novos tokens
    const tokens = generateTokenPair(user);
    
    // Salvar refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken
    });
    
    // Limitar número de refresh tokens (máximo 5)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    // Atualizar último login
    await user.updateLastLogin();
    await user.save();
    
    return {
      user: user.toJSON(),
      tokens
    };
  }
  
  /**
   * Renova tokens usando refresh token
   * @param {String} refreshToken - Refresh token
   * @returns {Object} Novos tokens
   */
  async refreshTokens(refreshToken) {
    // Validar refresh token
    const decoded = validateRefreshToken(refreshToken);
    
    // Buscar usuário
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    if (!user.isActive) {
      throw new Error('Conta desativada');
    }
    
    // Verificar se o refresh token existe no usuário
    const tokenExists = user.refreshTokens.some(
      tokenObj => tokenObj.token === refreshToken
    );
    
    if (!tokenExists) {
      throw new Error('Refresh token inválido');
    }
    
    // Remover o refresh token usado
    user.refreshTokens = user.refreshTokens.filter(
      tokenObj => tokenObj.token !== refreshToken
    );
    
    // Gerar novos tokens
    const tokens = generateTokenPair(user);
    
    // Salvar novo refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken
    });
    
    await user.save();
    
    return {
      user: user.toJSON(),
      tokens
    };
  }
  
  /**
   * Faz logout do usuário
   * @param {String} userId - ID do usuário
   * @param {String} refreshToken - Refresh token para remover
   */
  async logout(userId, refreshToken = null) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    if (refreshToken) {
      // Remover apenas o refresh token específico
      user.refreshTokens = user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
    } else {
      // Remover todos os refresh tokens (logout de todos os dispositivos)
      user.refreshTokens = [];
    }
    
    await user.save();
    
    return { message: 'Logout realizado com sucesso' };
  }
  
  /**
   * Faz logout de todos os dispositivos
   * @param {String} userId - ID do usuário
   */
  async logoutAll(userId) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    user.refreshTokens = [];
    await user.save();
    
    return { message: 'Logout de todos os dispositivos realizado com sucesso' };
  }
  
  /**
   * Altera a senha do usuário
   * @param {String} userId - ID do usuário
   * @param {String} currentPassword - Senha atual
   * @param {String} newPassword - Nova senha
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password +refreshTokens');
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Verificar senha atual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }
    
    // Atualizar senha
    user.password = newPassword;
    
    // Remover todos os refresh tokens (forçar novo login)
    user.refreshTokens = [];
    
    await user.save();
    
    return { message: 'Senha alterada com sucesso' };
  }
  
  /**
   * Solicita reset de senha (placeholder para implementação futura)
   * @param {String} email - Email do usuário
   */
  async requestPasswordReset(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Não revelar se o email existe ou não
      return { message: 'Se o email existir, um link de reset será enviado' };
    }
    
    // TODO: Implementar envio de email com token de reset
    // Por enquanto, apenas retornar sucesso
    return { message: 'Se o email existir, um link de reset será enviado' };
  }
  
  /**
   * Valida um usuário pelo ID
   * @param {String} userId - ID do usuário
   * @returns {Object} Dados do usuário
   */
  async validateUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    if (!user.isActive) {
      throw new Error('Conta desativada');
    }
    
    return user.toJSON();
  }
}

module.exports = new AuthService();

