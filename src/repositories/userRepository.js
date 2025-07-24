const { User } = require('../models');

class UserRepository {
  /**
   * Busca usuário por ID
   * @param {String} id - ID do usuário
   * @returns {Object|null} Usuário encontrado ou null
   */
  async findById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por ID: ${error.message}`);
    }
  }

  /**
   * Busca usuário por email
   * @param {String} email - Email do usuário
   * @returns {Object|null} Usuário encontrado ou null
   */
  async findByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
    }
  }

  /**
   * Busca usuário por email com senha
   * @param {String} email - Email do usuário
   * @returns {Object|null} Usuário encontrado ou null
   */
  async findByEmailWithPassword(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email com senha: ${error.message}`);
    }
  }

  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Object} Usuário criado
   */
  async create(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email já está em uso');
      }
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
  }

  /**
   * Atualiza um usuário
   * @param {String} id - ID do usuário
   * @param {Object} updateData - Dados para atualização
   * @returns {Object|null} Usuário atualizado ou null
   */
  async update(id, updateData) {
    try {
      return await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email já está em uso');
      }
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  /**
   * Deleta um usuário (soft delete)
   * @param {String} id - ID do usuário
   * @returns {Object|null} Usuário atualizado ou null
   */
  async delete(id) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erro ao deletar usuário: ${error.message}`);
    }
  }

  /**
   * Busca usuários ativos com paginação
   * @param {Object} options - Opções de busca
   * @returns {Object} Resultado paginado
   */
  async findActive(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search = ''
      } = options;

      const query = { isActive: true };
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
      ]);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar usuários ativos: ${error.message}`);
    }
  }

  /**
   * Atualiza configurações do usuário
   * @param {String} id - ID do usuário
   * @param {Object} configuracoes - Novas configurações
   * @returns {Object|null} Usuário atualizado ou null
   */
  async updateSettings(id, configuracoes) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { configuracoes },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Erro ao atualizar configurações: ${error.message}`);
    }
  }

  /**
   * Adiciona refresh token ao usuário
   * @param {String} id - ID do usuário
   * @param {String} refreshToken - Token de refresh
   * @returns {Object|null} Usuário atualizado ou null
   */
  async addRefreshToken(id, refreshToken) {
    try {
      const user = await User.findById(id).select('+refreshTokens');
      if (!user) return null;

      user.refreshTokens.push({ token: refreshToken });
      
      // Limitar a 5 tokens por usuário
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }

      return await user.save();
    } catch (error) {
      throw new Error(`Erro ao adicionar refresh token: ${error.message}`);
    }
  }

  /**
   * Remove refresh token do usuário
   * @param {String} id - ID do usuário
   * @param {String} refreshToken - Token de refresh para remover
   * @returns {Object|null} Usuário atualizado ou null
   */
  async removeRefreshToken(id, refreshToken) {
    try {
      const user = await User.findById(id).select('+refreshTokens');
      if (!user) return null;

      if (refreshToken) {
        user.refreshTokens = user.refreshTokens.filter(
          tokenObj => tokenObj.token !== refreshToken
        );
      } else {
        user.refreshTokens = [];
      }

      return await user.save();
    } catch (error) {
      throw new Error(`Erro ao remover refresh token: ${error.message}`);
    }
  }

  /**
   * Verifica se refresh token existe para o usuário
   * @param {String} id - ID do usuário
   * @param {String} refreshToken - Token de refresh
   * @returns {Boolean} True se token existe
   */
  async hasRefreshToken(id, refreshToken) {
    try {
      const user = await User.findById(id).select('+refreshTokens');
      if (!user) return false;

      return user.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);
    } catch (error) {
      throw new Error(`Erro ao verificar refresh token: ${error.message}`);
    }
  }

  /**
   * Atualiza último login do usuário
   * @param {String} id - ID do usuário
   * @returns {Object|null} Usuário atualizado ou null
   */
  async updateLastLogin(id) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { lastLogin: new Date() },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erro ao atualizar último login: ${error.message}`);
    }
  }

  /**
   * Busca estatísticas de usuários
   * @returns {Object} Estatísticas
   */
  async getStats() {
    try {
      const [total, active, inactive, recent] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
        User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        total,
        active,
        inactive,
        recent
      };
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }
  }
}

module.exports = new UserRepository();

