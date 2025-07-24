const { Card } = require('../models');

class CardRepository {
  /**
   * Busca cartão por ID
   * @param {String} id - ID do cartão
   * @returns {Object|null} Cartão encontrado ou null
   */
  async findById(id) {
    try {
      return await Card.findById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar cartão por ID: ${error.message}`);
    }
  }

  /**
   * Busca cartões do usuário
   * @param {String} userId - ID do usuário
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} Lista de cartões
   */
  async findByUser(userId, filters = {}) {
    try {
      const query = { user: userId, ...filters };
      return await Card.find(query).sort({ nome: 1 });
    } catch (error) {
      throw new Error(`Erro ao buscar cartões do usuário: ${error.message}`);
    }
  }

  /**
   * Busca cartões ativos do usuário
   * @param {String} userId - ID do usuário
   * @returns {Array} Lista de cartões ativos
   */
  async findActiveByUser(userId) {
    try {
      return await Card.findActiveByUser(userId);
    } catch (error) {
      throw new Error(`Erro ao buscar cartões ativos: ${error.message}`);
    }
  }

  /**
   * Cria um novo cartão
   * @param {Object} cardData - Dados do cartão
   * @returns {Object} Cartão criado
   */
  async create(cardData) {
    try {
      // Se principal, desativa outros principais do usuário
      if (cardData.principal) {
        await Card.updateMany({ user: cardData.user, principal: true }, { principal: false });
      }
      const card = new Card(cardData);
      return await card.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Já existe um cartão com este nome');
      }
      throw new Error(`Erro ao criar cartão: ${error.message}`);
    }
  }

  /**
   * Atualiza um cartão
   * @param {String} id - ID do cartão
   * @param {Object} updateData - Dados para atualização
   * @returns {Object|null} Cartão atualizado ou null
   */
  async update(id, updateData, userId) {
    try {
      // Se principal, desativa outros principais do usuário
      if (updateData.principal) {
        await Card.updateMany({ user: userId, principal: true, _id: { $ne: id } }, { principal: false });
      }
      return await Card.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Já existe um cartão com este nome');
      }
      throw new Error(`Erro ao atualizar cartão: ${error.message}`);
    }
  }

  /**
   * Deleta um cartão (soft delete)
   * @param {String} id - ID do cartão
   * @returns {Object|null} Cartão atualizado ou null
   */
  async delete(id) {
    try {
      return await Card.findByIdAndUpdate(
        id,
        { ativo: false },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erro ao deletar cartão: ${error.message}`);
    }
  }

  /**
   * Atualiza saldo do cartão
   * @param {String} id - ID do cartão
   * @param {Number} valor - Valor a ser adicionado/subtraído
   * @param {String} operacao - Tipo de operação ('add', 'subtract', 'set')
   * @returns {Object|null} Cartão atualizado ou null
   */
  async updateBalance(id, valor, operacao = 'add') {
    try {
      const card = await Card.findById(id);
      if (!card) return null;
      
      await card.atualizarSaldo(valor, operacao);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Erro ao atualizar saldo do cartão: ${error.message}`);
    }
  }

  /**
   * Busca cartões com paginação
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
        ativo = null
      } = options;

      const query = { user: userId };
      
      if (search) {
        query.$or = [
          { nome: { $regex: search, $options: 'i' } },
          { bandeira: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (ativo !== null) {
        query.ativo = ativo;
      }

      const skip = (page - 1) * limit;
      const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [cards, total] = await Promise.all([
        Card.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Card.countDocuments(query)
      ]);

      return {
        data: cards,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar cartões com paginação: ${error.message}`);
    }
  }

  /**
   * Busca estatísticas de cartões do usuário
   * @param {String} userId - ID do usuário
   * @returns {Object} Estatísticas
   */
  async getStatsByUser(userId) {
    try {
      const [total, ativos, inativos] = await Promise.all([
        Card.countDocuments({ user: userId }),
        Card.countDocuments({ user: userId, ativo: true }),
        Card.countDocuments({ user: userId, ativo: false })
      ]);

      // Calcular totais de limite e saldo
      const cards = await Card.find({ user: userId, ativo: true });
      const totals = cards.reduce((acc, card) => {
        acc.totalLimite += card.limite;
        acc.totalSaldo += card.saldoAtual;
        acc.totalDisponivel += card.limiteDisponivel;
        return acc;
      }, { totalLimite: 0, totalSaldo: 0, totalDisponivel: 0 });

      return {
        total,
        ativos,
        inativos,
        ...totals
      };
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas de cartões: ${error.message}`);
    }
  }

  /**
   * Busca cartões próximos do vencimento
   * @param {String} userId - ID do usuário
   * @param {Number} days - Número de dias
   * @returns {Array} Cartões próximos do vencimento
   */
  async findNearDueDate(userId, days = 7) {
    try {
      const cards = await Card.find({ user: userId, ativo: true });
      const hoje = new Date();
      const limite = new Date();
      limite.setDate(hoje.getDate() + days);

      return cards.filter(card => {
        const proximoVencimento = card.proximoVencimento;
        return proximoVencimento >= hoje && proximoVencimento <= limite;
      });
    } catch (error) {
      throw new Error(`Erro ao buscar cartões próximos do vencimento: ${error.message}`);
    }
  }

  /**
   * Busca cartões por bandeira
   * @param {String} userId - ID do usuário
   * @param {String} bandeira - Bandeira do cartão
   * @returns {Array} Cartões da bandeira
   */
  async findByBrand(userId, bandeira) {
    try {
      return await Card.find({
        user: userId,
        bandeira: { $regex: new RegExp(`^${bandeira}$`, 'i') },
        ativo: true
      }).sort({ nome: 1 });
    } catch (error) {
      throw new Error(`Erro ao buscar cartões por bandeira: ${error.message}`);
    }
  }

  /**
   * Busca gastos do cartão no mês
   * @param {String} id - ID do cartão
   * @param {Number} ano - Ano
   * @param {Number} mes - Mês (1-12)
   * @returns {Number} Total de gastos
   */
  async getMonthlyExpenses(id, ano, mes) {
    try {
      const card = await Card.findById(id);
      if (!card) return 0;
      
      return await card.getGastosMes(ano, mes);
    } catch (error) {
      throw new Error(`Erro ao buscar gastos mensais do cartão: ${error.message}`);
    }
  }

  /**
   * Busca cartões com limite baixo
   * @param {String} userId - ID do usuário
   * @param {Number} threshold - Percentual limite (padrão 80%)
   * @returns {Array} Cartões com limite baixo
   */
  async findLowLimit(userId, threshold = 80) {
    try {
      const cards = await Card.find({ user: userId, ativo: true });
      
      return cards.filter(card => card.percentualUsado >= threshold);
    } catch (error) {
      throw new Error(`Erro ao buscar cartões com limite baixo: ${error.message}`);
    }
  }

  /**
   * Busca resumo de cartões por bandeira
   * @param {String} userId - ID do usuário
   * @returns {Array} Resumo por bandeira
   */
  async getSummaryByBrand(userId) {
    try {
      const cards = await Card.find({ user: userId, ativo: true });
      
      const summary = cards.reduce((acc, card) => {
        const bandeira = card.bandeira;
        if (!acc[bandeira]) {
          acc[bandeira] = {
            bandeira,
            count: 0,
            totalLimite: 0,
            totalSaldo: 0,
            totalDisponivel: 0
          };
        }
        
        acc[bandeira].count++;
        acc[bandeira].totalLimite += card.limite;
        acc[bandeira].totalSaldo += card.saldoAtual;
        acc[bandeira].totalDisponivel += card.limiteDisponivel;
        
        return acc;
      }, {});
      
      return Object.values(summary);
    } catch (error) {
      throw new Error(`Erro ao buscar resumo por bandeira: ${error.message}`);
    }
  }
}

module.exports = new CardRepository();

