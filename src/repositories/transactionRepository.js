const { Transaction } = require('../models');
const mongoose = require('mongoose');

class TransactionRepository {
  /**
   * Busca transação por ID
   * @param {String} id - ID da transação
   * @returns {Object|null} Transação encontrada ou null
   */
  async findById(id) {
    try {
      return await Transaction.findById(id)
        .populate('categoria', 'nome cor icone')
        .populate('cartao', 'nome bandeira');
    } catch (error) {
      throw new Error(`Erro ao buscar transação por ID: ${error.message}`);
    }
  }

  /**
   * Busca transações do usuário
   * @param {String} userId - ID do usuário
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} Lista de transações
   */
  async findByUser(userId, filters = {}) {
    try {
      const query = { user: userId, ...filters };
      return await Transaction.find(query)
        .populate('categoria', 'nome cor icone')
        .populate('cartao', 'nome bandeira')
        .sort({ data: -1 });
    } catch (error) {
      throw new Error(`Erro ao buscar transações do usuário: ${error.message}`);
    }
  }

  /**
   * Busca transações com paginação e filtros
   * @param {String} userId - ID do usuário
   * @param {Object} options - Opções de busca
   * @returns {Object} Resultado paginado
   */
  async findWithPagination(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'data',
        sortOrder = 'desc',
        search = '',
        tipo = null,
        categoriaId = null,
        cartaoId = null,
        status = null,
        startDate = null,
        endDate = null,
        valorMin = null,
        valorMax = null
      } = options;

      const query = { user: userId };
      
      if (search) {
        query.descricao = { $regex: search, $options: 'i' };
      }
      
      if (tipo) {
        query.tipo = tipo;
      }
      
      if (categoriaId) {
        query.categoriaId = categoriaId;
      }
      
      if (cartaoId) {
        query.cartaoId = cartaoId;
      }
      
      if (status) {
        query.status = status;
      }
      
      if (startDate || endDate) {
        query.data = {};
        if (startDate) query.data.$gte = new Date(startDate);
        if (endDate) query.data.$lte = new Date(endDate);
      }
      
      if (valorMin !== null || valorMax !== null) {
        query.valor = {};
        if (valorMin !== null) query.valor.$gte = valorMin;
        if (valorMax !== null) query.valor.$lte = valorMax;
      }

      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .populate('categoria', 'nome cor icone')
          .populate('cartao', 'nome bandeira')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Transaction.countDocuments(query)
      ]);

      return {
        data: transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar transações com paginação: ${error.message}`);
    }
  }

  /**
   * Cria uma nova transação
   * @param {Object} transactionData - Dados da transação
   * @returns {Object} Transação criada
   */
  async create(transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();
      
      return await this.findById(savedTransaction._id);
    } catch (error) {
      throw new Error(`Erro ao criar transação: ${error.message}`);
    }
  }

  /**
   * Cria múltiplas transações
   * @param {Array} transactionsData - Array de dados das transações
   * @returns {Array} Transações criadas
   */
  async createMany(transactionsData) {
    try {
      const transactions = await Transaction.insertMany(transactionsData);
      
      // Buscar as transações criadas com populate
      const ids = transactions.map(t => t._id);
      return await Transaction.find({ _id: { $in: ids } })
        .populate('categoria', 'nome cor icone')
        .populate('cartao', 'nome bandeira');
    } catch (error) {
      throw new Error(`Erro ao criar transações em lote: ${error.message}`);
    }
  }

  /**
   * Atualiza uma transação
   * @param {String} id - ID da transação
   * @param {Object} updateData - Dados para atualização
   * @returns {Object|null} Transação atualizada ou null
   */
  async update(id, updateData) {
    try {
      const transaction = await Transaction.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!transaction) return null;
      
      return await this.findById(transaction._id);
    } catch (error) {
      throw new Error(`Erro ao atualizar transação: ${error.message}`);
    }
  }

  /**
   * Deleta uma transação
   * @param {String} id - ID da transação
   * @returns {Object|null} Transação deletada ou null
   */
  async delete(id) {
    try {
      return await Transaction.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar transação: ${error.message}`);
    }
  }

  /**
   * Busca resumo financeiro do usuário
   * @param {String} userId - ID do usuário
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Object} Resumo financeiro
   */
  async getFinancialSummary(userId, startDate = null, endDate = null) {
    try {
      const matchStage = {
        user: new mongoose.Types.ObjectId(userId),
        status: 'confirmada'
      };
      
      if (startDate || endDate) {
        matchStage.data = {};
        if (startDate) matchStage.data.$gte = startDate;
        if (endDate) matchStage.data.$lte = endDate;
      }

      const result = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: '$valor' },
            count: { $sum: 1 }
          }
        }
      ]);

      const summary = {
        receitas: 0,
        despesas: 0,
        saldo: 0,
        totalTransacoes: 0
      };

      result.forEach(item => {
        if (item._id === 'receita') {
          summary.receitas = Math.abs(item.total);
          summary.totalTransacoes += item.count;
        } else if (item._id === 'despesa') {
          summary.despesas = Math.abs(item.total);
          summary.totalTransacoes += item.count;
        }
      });

      summary.saldo = summary.receitas - summary.despesas;

      return summary;
    } catch (error) {
      throw new Error(`Erro ao buscar resumo financeiro: ${error.message}`);
    }
  }

  /**
   * Busca transações por categoria
   * @param {String} userId - ID do usuário
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Array} Transações agrupadas por categoria
   */
  async getByCategory(userId, startDate = null, endDate = null) {
    try {
      const matchStage = {
        user: new mongoose.Types.ObjectId(userId),
        status: 'confirmada',
        categoriaId: { $ne: null }
      };
      
      if (startDate || endDate) {
        matchStage.data = {};
        if (startDate) matchStage.data.$gte = startDate;
        if (endDate) matchStage.data.$lte = endDate;
      }

      return await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              categoria: '$categoriaId',
              tipo: '$tipo'
            },
            total: { $sum: '$valor' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id.categoria',
            foreignField: '_id',
            as: 'categoria'
          }
        },
        {
          $unwind: '$categoria'
        },
        {
          $project: {
            _id: 0,
            categoria: '$categoria',
            tipo: '$_id.tipo',
            total: { $abs: '$total' },
            count: 1
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Erro ao buscar transações por categoria: ${error.message}`);
    }
  }

  /**
   * Busca fluxo de caixa mensal
   * @param {String} userId - ID do usuário
   * @param {Number} year - Ano
   * @returns {Array} Fluxo de caixa por mês
   */
  async getMonthlyCashFlow(userId, year) {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      return await Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            status: 'confirmada',
            data: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$data' },
              tipo: '$tipo'
            },
            total: { $sum: '$valor' }
          }
        },
        {
          $group: {
            _id: '$_id.month',
            receitas: {
              $sum: {
                $cond: [
                  { $eq: ['$_id.tipo', 'receita'] },
                  { $abs: '$total' },
                  0
                ]
              }
            },
            despesas: {
              $sum: {
                $cond: [
                  { $eq: ['$_id.tipo', 'despesa'] },
                  { $abs: '$total' },
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            mes: '$_id',
            receitas: 1,
            despesas: 1,
            saldo: { $subtract: ['$receitas', '$despesas'] }
          }
        },
        {
          $sort: { mes: 1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Erro ao buscar fluxo de caixa mensal: ${error.message}`);
    }
  }

  /**
   * Busca estatísticas de transações do usuário
   * @param {String} userId - ID do usuário
   * @returns {Object} Estatísticas
   */
  async getStatsByUser(userId) {
    try {
      const [total, receitas, despesas, pendentes, hoje] = await Promise.all([
        Transaction.countDocuments({ user: userId }),
        Transaction.countDocuments({ user: userId, tipo: 'receita' }),
        Transaction.countDocuments({ user: userId, tipo: 'despesa' }),
        Transaction.countDocuments({ user: userId, status: 'pendente' }),
        Transaction.countDocuments({
          user: userId,
          data: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        })
      ]);

      return {
        total,
        receitas,
        despesas,
        pendentes,
        hoje
      };
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas de transações: ${error.message}`);
    }
  }

  /**
   * Busca transações recentes do usuário
   * @param {String} userId - ID do usuário
   * @param {Number} limit - Limite de resultados
   * @returns {Array} Transações recentes
   */
  async findRecent(userId, limit = 5) {
    try {
      return await Transaction.find({ user: userId })
        .populate('categoria', 'nome cor icone')
        .populate('cartao', 'nome bandeira')
        .sort({ data: -1 })
        .limit(limit);
    } catch (error) {
      throw new Error(`Erro ao buscar transações recentes: ${error.message}`);
    }
  }
}

module.exports = new TransactionRepository();

