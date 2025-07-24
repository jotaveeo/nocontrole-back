const { Goal } = require('../models');

class GoalRepository {
  /**
   * Busca meta por ID
   * @param {String} id - ID da meta
   * @returns {Object|null} Meta encontrada ou null
   */
  async findById(id) {
    try {
      return await Goal.findById(id)
        .populate('categoria', 'nome cor icone')
        .populate('categoriaId', 'nome cor icone');
    } catch (error) {
      throw new Error(`Erro ao buscar meta por ID: ${error.message}`);
    }
  }

  /**
   * Busca metas do usuário
   * @param {String} userId - ID do usuário
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} Lista de metas
   */
  async findByUser(userId, filters = {}) {
    try {
      const query = { user: userId, ...filters };
      return await Goal.find(query)
        .populate('categoria', 'nome cor icone')
        .populate('categoriaId', 'nome cor icone')
        .sort({ prazo: 1 });
    } catch (error) {
      throw new Error(`Erro ao buscar metas do usuário: ${error.message}`);
    }
  }

  /**
   * Busca metas ativas do usuário
   * @param {String} userId - ID do usuário
   * @returns {Array} Lista de metas ativas
   */
  async findActiveByUser(userId) {
    try {
      return await Goal.findActiveByUser(userId);
    } catch (error) {
      throw new Error(`Erro ao buscar metas ativas: ${error.message}`);
    }
  }

  /**
   * Cria uma nova meta
   * @param {Object} goalData - Dados da meta
   * @returns {Object} Meta criada
   */
  async create(goalData) {
    try {
      const goal = new Goal(goalData);
      const savedGoal = await goal.save();
      return await this.findById(savedGoal._id);
    } catch (error) {
      throw new Error(`Erro ao criar meta: ${error.message}`);
    }
  }

  /**
   * Atualiza uma meta
   * @param {String} id - ID da meta
   * @param {Object} updateData - Dados para atualização
   * @returns {Object|null} Meta atualizada ou null
   */
  async update(id, updateData) {
    try {
      const goal = await Goal.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!goal) return null;
      
      return await this.findById(goal._id);
    } catch (error) {
      throw new Error(`Erro ao atualizar meta: ${error.message}`);
    }
  }

  /**
   * Deleta uma meta (soft delete)
   * @param {String} id - ID da meta
   * @returns {Object|null} Meta atualizada ou null
   */
  async delete(id) {
    try {
      return await Goal.findByIdAndUpdate(
        id,
        { ativo: false },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erro ao deletar meta: ${error.message}`);
    }
  }

  /**
   * Atualiza progresso da meta
   * @param {String} id - ID da meta
   * @param {Number} valor - Valor a ser adicionado
   * @returns {Object|null} Meta atualizada ou null
   */
  async updateProgress(id, valor) {
    try {
      const goal = await Goal.findById(id);
      if (!goal) return null;
      
      await goal.updateProgress(valor);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Erro ao atualizar progresso da meta: ${error.message}`);
    }
  }

  /**
   * Define progresso da meta
   * @param {String} id - ID da meta
   * @param {Number} valor - Valor total do progresso
   * @returns {Object|null} Meta atualizada ou null
   */
  async setProgress(id, valor) {
    try {
      const goal = await Goal.findById(id);
      if (!goal) return null;
      
      await goal.setProgress(valor);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Erro ao definir progresso da meta: ${error.message}`);
    }
  }

  /**
   * Busca metas com paginação
   * @param {String} userId - ID do usuário
   * @param {Object} options - Opções de busca
   * @returns {Object} Resultado paginado
   */
  async findWithPagination(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'prazo',
        sortOrder = 'asc',
        search = '',
        ativo = null
      } = options;

      const query = { user: userId };
      
      if (search) {
        query.nome = { $regex: search, $options: 'i' };
      }
      
      if (ativo !== null) {
        query.ativo = ativo;
      }

      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [goals, total] = await Promise.all([
        Goal.find(query)
          .populate('categoria', 'nome cor icone')
          .populate('categoriaId', 'nome cor icone')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Goal.countDocuments(query)
      ]);

      return {
        data: goals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar metas com paginação: ${error.message}`);
    }
  }

  /**
   * Busca estatísticas de metas do usuário
   * @param {String} userId - ID do usuário
   * @returns {Object} Estatísticas
   */
  async getStatsByUser(userId) {
    try {
      const [total, ativas, atingidas, vencidas] = await Promise.all([
        Goal.countDocuments({ user: userId }),
        Goal.countDocuments({ user: userId, ativo: true }),
        Goal.countDocuments({ user: userId, ativo: true }).then(async () => {
          const goals = await Goal.find({ user: userId, ativo: true });
          return goals.filter(goal => goal.atingida).length;
        }),
        Goal.countDocuments({ user: userId, ativo: true }).then(async () => {
          const goals = await Goal.find({ user: userId, ativo: true });
          const hoje = new Date();
          return goals.filter(goal => new Date(goal.prazo) < hoje && !goal.atingida).length;
        })
      ]);

      return {
        total,
        ativas,
        atingidas,
        vencidas
      };
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas de metas: ${error.message}`);
    }
  }

  /**
   * Busca metas próximas do vencimento
   * @param {String} userId - ID do usuário
   * @param {Number} days - Número de dias
   * @returns {Array} Metas próximas do vencimento
   */
  async findNearDeadline(userId, days = 7) {
    try {
      const hoje = new Date();
      const limite = new Date();
      limite.setDate(hoje.getDate() + days);

      return await Goal.find({
        user: userId,
        ativo: true,
        prazo: { $gte: hoje, $lte: limite }
      })
        .populate('categoria', 'nome cor icone')
        .populate('categoriaId', 'nome cor icone')
        .sort({ prazo: 1 });
    } catch (error) {
      throw new Error(`Erro ao buscar metas próximas do vencimento: ${error.message}`);
    }
  }

  /**
   * Busca metas por categoria
   * @param {String} userId - ID do usuário
   * @param {String} categoriaId - ID da categoria
   * @returns {Array} Metas da categoria
   */
  async findByCategory(userId, categoriaId) {
    try {
      return await Goal.find({
        user: userId,
        categoriaId,
        ativo: true
      })
        .populate('categoria', 'nome cor icone')
        .populate('categoriaId', 'nome cor icone')
        .sort({ prazo: 1 });
    } catch (error) {
      throw new Error(`Erro ao buscar metas por categoria: ${error.message}`);
    }
  }
}

module.exports = new GoalRepository();

