const { Category } = require('../models');

class CategoryRepository {
  /**
   * Busca categoria por ID
   * @param {String} id - ID da categoria
   * @returns {Object|null} Categoria encontrada ou null
   */
  async findById(id) {
    try {
      return await Category.findById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar categoria por ID: ${error.message}`);
    }
  }

  /**
   * Busca categorias do usuário
   * @param {String} userId - ID do usuário
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} Lista de categorias
   */
  async findByUser(userId, filters = {}) {
    try {
      const query = { user: userId, ...filters };
      return await Category.find(query).sort({ nome: 1 });
    } catch (error) {
      throw new Error(`Erro ao buscar categorias do usuário: ${error.message}`);
    }
  }

  /**
   * Busca categorias ativas do usuário
   * @param {String} userId - ID do usuário
   * @param {String} tipo - Tipo da categoria (opcional)
   * @returns {Array} Lista de categorias ativas
   */
  async findActiveByUser(userId, tipo = null) {
    try {
      const query = { user: userId, ativo: true };
      if (tipo) query.tipo = tipo;
      
      return await Category.find(query).sort({ nome: 1 });
    } catch (error) {
      throw new Error(`Erro ao buscar categorias ativas: ${error.message}`);
    }
  }

  /**
   * Cria uma nova categoria
   * @param {Object} categoryData - Dados da categoria
   * @returns {Object} Categoria criada
   */
  async create(categoryData) {
    try {
      const category = new Category(categoryData);
      return await category.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Já existe uma categoria com este nome');
      }
      throw new Error(`Erro ao criar categoria: ${error.message}`);
    }
  }

  /**
   * Atualiza uma categoria
   * @param {String} id - ID da categoria
   * @param {Object} updateData - Dados para atualização
   * @returns {Object|null} Categoria atualizada ou null
   */
  async update(id, updateData) {
    try {
      return await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Já existe uma categoria com este nome');
      }
      throw new Error(`Erro ao atualizar categoria: ${error.message}`);
    }
  }

  /**
   * Deleta uma categoria (soft delete)
   * @param {String} id - ID da categoria
   * @returns {Object|null} Categoria atualizada ou null
   */
  async delete(id) {
    try {
      return await Category.findByIdAndUpdate(
        id,
        { ativo: false },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erro ao deletar categoria: ${error.message}`);
    }
  }

  /**
   * Busca categoria por nome e usuário
   * @param {String} userId - ID do usuário
   * @param {String} nome - Nome da categoria
   * @returns {Object|null} Categoria encontrada ou null
   */
  async findByNameAndUser(userId, nome) {
    try {
      return await Category.findOne({
        user: userId,
        nome: { $regex: new RegExp(`^${nome}$`, 'i') }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar categoria por nome: ${error.message}`);
    }
  }

  /**
   * Busca categorias com paginação
   * @param {String} userId - ID do usuário
   * @param {Object} options - Opções de busca
   * @returns {Object} Resultado paginado
   */
  async findWithPagination(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'nome',
        sortOrder = 'asc',
        search = '',
        tipo = null,
        ativo = null
      } = options;

      const query = { user: userId };
      
      if (search) {
        query.nome = { $regex: search, $options: 'i' };
      }
      
      if (tipo) {
        query.tipo = tipo;
      }
      
      if (ativo !== null) {
        query.ativo = ativo;
      }

      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [categories, total] = await Promise.all([
        Category.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Category.countDocuments(query)
      ]);

      return {
        data: categories,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar categorias com paginação: ${error.message}`);
    }
  }

  /**
   * Busca estatísticas de categorias do usuário
   * @param {String} userId - ID do usuário
   * @returns {Object} Estatísticas
   */
  async getStatsByUser(userId) {
    try {
      const [total, receitas, despesas, ativas, inativas] = await Promise.all([
        Category.countDocuments({ user: userId }),
        Category.countDocuments({ user: userId, tipo: 'receita' }),
        Category.countDocuments({ user: userId, tipo: 'despesa' }),
        Category.countDocuments({ user: userId, ativo: true }),
        Category.countDocuments({ user: userId, ativo: false })
      ]);

      return {
        total,
        receitas,
        despesas,
        ativas,
        inativas
      };
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas de categorias: ${error.message}`);
    }
  }

  /**
   * Busca categorias mais usadas do usuário
   * @param {String} userId - ID do usuário
   * @param {Number} limit - Limite de resultados
   * @returns {Array} Categorias mais usadas
   */
  async findMostUsed(userId, limit = 5) {
    try {
      const Transaction = require('../models/Transaction');
      
      const result = await Transaction.aggregate([
        {
          $match: {
            user: new require('mongoose').Types.ObjectId(userId),
            categoriaId: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$categoriaId',
            count: { $sum: 1 },
            totalValue: { $sum: '$valor' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: '$category'
        },
        {
          $project: {
            _id: 0,
            category: '$category',
            count: 1,
            totalValue: 1
          }
        }
      ]);

      return result;
    } catch (error) {
      throw new Error(`Erro ao buscar categorias mais usadas: ${error.message}`);
    }
  }

  /**
   * Cria categorias padrão para um usuário
   * @param {String} userId - ID do usuário
   * @returns {Array} Categorias criadas
   */
  async createDefaultCategories(userId) {
    try {
      const defaultCategories = [
        // Categorias de Receita
        { nome: 'Salário', tipo: 'receita', cor: '#10B981', icone: 'dollar-sign' },
        { nome: 'Freelance', tipo: 'receita', cor: '#3B82F6', icone: 'briefcase' },
        { nome: 'Investimentos', tipo: 'receita', cor: '#8B5CF6', icone: 'trending-up' },
        { nome: 'Outros', tipo: 'receita', cor: '#6B7280', icone: 'plus' },
        
        // Categorias de Despesa
        { nome: 'Alimentação', tipo: 'despesa', cor: '#EF4444', icone: 'utensils' },
        { nome: 'Transporte', tipo: 'despesa', cor: '#F59E0B', icone: 'car' },
        { nome: 'Moradia', tipo: 'despesa', cor: '#8B5CF6', icone: 'home' },
        { nome: 'Saúde', tipo: 'despesa', cor: '#EC4899', icone: 'heart' },
        { nome: 'Educação', tipo: 'despesa', cor: '#3B82F6', icone: 'book' },
        { nome: 'Lazer', tipo: 'despesa', cor: '#10B981', icone: 'smile' },
        { nome: 'Compras', tipo: 'despesa', cor: '#F97316', icone: 'shopping-bag' },
        { nome: 'Contas', tipo: 'despesa', cor: '#6B7280', icone: 'file-text' }
      ];

      const categories = defaultCategories.map(cat => ({
        ...cat,
        user: userId,
        ativo: true
      }));

      return await Category.insertMany(categories);
    } catch (error) {
      throw new Error(`Erro ao criar categorias padrão: ${error.message}`);
    }
  }

  /**
   * Verifica se usuário tem categorias
   * @param {String} userId - ID do usuário
   * @returns {Boolean} True se tem categorias
   */
  async hasCategories(userId) {
    try {
      const count = await Category.countDocuments({ user: userId });
      return count > 0;
    } catch (error) {
      throw new Error(`Erro ao verificar categorias: ${error.message}`);
    }
  }

  /**
   * Apaga todas as categorias de um usuário (hard delete)
   * @param {String} userId - ID do usuário
   * @returns {Object} Resultado da exclusão
   */
  async deleteAllByUser(userId) {
    try {
      // Hard delete: remove fisicamente do banco
      return await Category.deleteMany({ user: userId });
    } catch (error) {
      throw new Error(`Erro ao apagar todas as categorias do usuário: ${error.message}`);
    }
  }
}

module.exports = new CategoryRepository();

