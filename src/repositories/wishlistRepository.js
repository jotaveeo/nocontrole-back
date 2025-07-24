const { Wishlist } = require('../models');

class WishlistRepository {
  /**
   * Busca item da wishlist por ID
   * @param {String} id - ID do item
   * @returns {Object|null} Item encontrado ou null
   */
  async findById(id) {
    try {
      return await Wishlist.findById(id)
        .populate('categoria', 'nome cor icone')
    } catch (error) {
      throw new Error(`Erro ao buscar item da wishlist por ID: ${error.message}`);
    }
  }

  /**
   * Busca itens da wishlist do usuário
   * @param {String} userId - ID do usuário
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} Lista de itens
   */
  async findByUser(userId, filters = {}) {
    try {
      const query = { user: userId, ...filters };
      return await Wishlist.find(query)
        .populate('categoria', 'nome cor icone')
        .sort({ prioridade: 1, createdAt: -1 });
    } catch (error) {
      throw new Error(`Erro ao buscar itens da wishlist do usuário: ${error.message}`);
    }
  }

  /**
   * Busca itens ativos da wishlist do usuário
   * @param {String} userId - ID do usuário
   * @returns {Array} Lista de itens ativos
   */
  async findActiveByUser(userId) {
    try {
      return await Wishlist.findActiveByUser(userId);
    } catch (error) {
      throw new Error(`Erro ao buscar itens ativos da wishlist: ${error.message}`);
    }
  }

  /**
   * Busca itens por status
   * @param {String} userId - ID do usuário
   * @param {String} status - Status do item
   * @returns {Array} Lista de itens
   */
  async findByStatus(userId, status) {
    try {
      return await Wishlist.findByStatus(userId, status);
    } catch (error) {
      throw new Error(`Erro ao buscar itens por status: ${error.message}`);
    }
  }

  /**
   * Busca itens por prioridade
   * @param {String} userId - ID do usuário
   * @param {String} prioridade - Prioridade do item
   * @returns {Array} Lista de itens
   */
  async findByPriority(userId, prioridade) {
    try {
      return await Wishlist.findByPriority(userId, prioridade);
    } catch (error) {
      throw new Error(`Erro ao buscar itens por prioridade: ${error.message}`);
    }
  }

  /**
   * Cria um novo item da wishlist
   * @param {Object} wishlistData - Dados do item
   * @returns {Object} Item criado
   */
  async create(wishlistData) {
    try {
      const wishlistItem = new Wishlist(wishlistData);
      const savedItem = await wishlistItem.save();
      return await this.findById(savedItem._id);
    } catch (error) {
      throw new Error(`Erro ao criar item da wishlist: ${error.message}`);
    }
  }

  /**
   * Atualiza um item da wishlist
   * @param {String} id - ID do item
   * @param {Object} updateData - Dados para atualização
   * @returns {Object|null} Item atualizado ou null
   */
  async update(id, updateData) {
    try {
      const item = await Wishlist.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!item) return null;
      
      return await this.findById(item._id);
    } catch (error) {
      throw new Error(`Erro ao atualizar item da wishlist: ${error.message}`);
    }
  }

  /**
   * Deleta um item da wishlist (soft delete)
   * @param {String} id - ID do item
   * @returns {Object|null} Item atualizado ou null
   */
  async delete(id) {
    try {
      return await Wishlist.findByIdAndUpdate(
        id,
        { ativo: false },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erro ao deletar item da wishlist: ${error.message}`);
    }
  }

  /**
   * Adiciona valor economizado ao item
   * @param {String} id - ID do item
   * @param {Number} valor - Valor a ser adicionado
   * @returns {Object|null} Item atualizado ou null
   */
  async addSavings(id, valor) {
    try {
      const item = await Wishlist.findById(id);
      if (!item) return null;
      
      await item.adicionarEconomia(valor);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Erro ao adicionar economia ao item: ${error.message}`);
    }
  }

  /**
   * Marca item como comprado
   * @param {String} id - ID do item
   * @returns {Object|null} Item atualizado ou null
   */
  async markAsPurchased(id) {
    try {
      const item = await Wishlist.findById(id);
      if (!item) return null;
      
      await item.marcarComoComprado();
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Erro ao marcar item como comprado: ${error.message}`);
    }
  }

  /**
   * Busca itens com paginação
   * @param {String} userId - ID do usuário
   * @param {Object} options - Opções de busca
   * @returns {Object} Resultado paginado
   */
  async findWithPagination(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'prioridade',
        sortOrder = 'asc',
        search = '',
        status = null,
        prioridade = null,
        ativo = null
      } = options;

      const query = { user: userId };
      
      if (search) {
        query.$or = [
          { nome: { $regex: search, $options: 'i' } },
          { descricao: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        query.status = status;
      }
      
      if (prioridade) {
        query.prioridade = prioridade;
      }
      
      if (ativo !== null) {
        query.ativo = ativo;
      }

      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [items, total] = await Promise.all([
        Wishlist.find(query)
          .populate('categoria', 'nome cor icone')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Wishlist.countDocuments(query)
      ]);

      return {
        data: items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar itens com paginação: ${error.message}`);
    }
  }

  /**
   * Busca estatísticas da wishlist do usuário
   * @param {String} userId - ID do usuário
   * @returns {Object} Estatísticas
   */
  async getStatsByUser(userId) {
    try {
      return await Wishlist.getStatsByUser(userId);
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas da wishlist: ${error.message}`);
    }
  }

  /**
   * Busca itens próximos da meta
   * @param {String} userId - ID do usuário
   * @param {Number} threshold - Percentual limite (padrão 80%)
   * @returns {Array} Itens próximos da meta
   */
  async findNearGoal(userId, threshold = 80) {
    try {
      return await Wishlist.findNearGoal(userId, threshold);
    } catch (error) {
      throw new Error(`Erro ao buscar itens próximos da meta: ${error.message}`);
    }
  }

  /**
   * Busca itens por categoria
   * @param {String} userId - ID do usuário
   * @param {String} categoriaId - ID da categoria
   * @returns {Array} Itens da categoria
   */
  async findByCategory(userId, categoriaId) {
    try {
      return await Wishlist.find({
        user: userId,
        categoriaId,
        ativo: true
      })
        .populate('categoria', 'nome cor icone')
        .sort({ prioridade: 1, createdAt: -1 });
    } catch (error) {
      throw new Error(`Erro ao buscar itens por categoria: ${error.message}`);
    }
  }

  /**
   * Busca itens atrasados
   * @param {String} userId - ID do usuário
   * @returns {Array} Itens atrasados
   */
  async findOverdue(userId) {
    try {
      const items = await Wishlist.find({
        user: userId,
        ativo: true,
        dataDesejada: { $ne: null }
      })
        .populate('categoria', 'nome cor icone')

      return items.filter(item => item.atrasado);
    } catch (error) {
      throw new Error(`Erro ao buscar itens atrasados: ${error.message}`);
    }
  }

  /**
   * Busca resumo por prioridade
   * @param {String} userId - ID do usuário
   * @returns {Array} Resumo por prioridade
   */
  async getSummaryByPriority(userId) {
    try {
      const items = await Wishlist.find({ user: userId, ativo: true });
      
      const summary = items.reduce((acc, item) => {
        const prioridade = item.prioridade;
        if (!acc[prioridade]) {
          acc[prioridade] = {
            prioridade,
            count: 0,
            totalValor: 0,
            totalEconomizado: 0,
            mediaProgresso: 0
          };
        }
        
        acc[prioridade].count++;
        acc[prioridade].totalValor += item.valor;
        acc[prioridade].totalEconomizado += item.valorEconomizado;
        acc[prioridade].mediaProgresso += item.progresso;
        
        return acc;
      }, {});
      
      // Calcular média do progresso
      Object.values(summary).forEach(item => {
        if (item.count > 0) {
          item.mediaProgresso = item.mediaProgresso / item.count;
        }
      });
      
      return Object.values(summary);
    } catch (error) {
      throw new Error(`Erro ao buscar resumo por prioridade: ${error.message}`);
    }
  }
}

module.exports = new WishlistRepository();

