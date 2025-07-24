const { cardRepository } = require('../repositories');
const { asyncHandler } = require('../middlewares/errorHandler');

class CardController {
  /**
   * Lista todos os cartões do usuário
   */
  getCards = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { ativo } = req.query;
    
    const filters = {};
    if (ativo !== undefined) filters.ativo = ativo === 'true';
    
    const cards = await cardRepository.findByUser(userId, filters);
    
    res.json({
      success: true,
      data: cards
    });
  });

  /**
   * Lista cartões ativos do usuário
   */
  getActiveCards = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const cards = await cardRepository.findActiveByUser(userId);
    
    res.json({
      success: true,
      data: cards
    });
  });

  /**
   * Busca cartão por ID
   */
  getCardById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    const card = await cardRepository.findById(id);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }
    
    if (card.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    res.json({
      success: true,
      data: card
    });
  });

  /**
   * Cria um novo cartão
   */
  createCard = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const cardData = {
      ...req.body,
      user: userId
    };
    
    const card = await cardRepository.create(cardData);
    
    res.status(201).json({
      success: true,
      message: 'Cartão criado com sucesso',
      data: card
    });
  });

  /**
   * Atualiza um cartão
   */
  updateCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Verificar se o cartão existe e pertence ao usuário
    const existingCard = await cardRepository.findById(id);
    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }
    
    if (existingCard.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    try {
      const card = await cardRepository.update(id, req.body, userId);
      res.json({
        success: true,
        message: 'Cartão atualizado com sucesso',
        data: card
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar cartão'
      });
    }
  });

  /**
   * Deleta um cartão (soft delete)
   */
  deleteCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Verificar se o cartão existe e pertence ao usuário
    const existingCard = await cardRepository.findById(id);
    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }
    
    if (existingCard.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const card = await cardRepository.delete(id);
    
    res.json({
      success: true,
      message: 'Cartão deletado com sucesso',
      data: card
    });
  });

  /**
   * Atualiza saldo do cartão
   */
  updateBalance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { valor, operacao = 'add' } = req.body;
    const userId = req.user._id;
    
    // Verificar se o cartão existe e pertence ao usuário
    const existingCard = await cardRepository.findById(id);
    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }
    
    if (existingCard.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const card = await cardRepository.updateBalance(id, valor, operacao);
    
    res.json({
      success: true,
      message: 'Saldo do cartão atualizado com sucesso',
      data: card
    });
  });

  /**
   * Busca cartões com paginação
   */
  getCardsWithPagination = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'nome',
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      ativo: req.query.ativo !== undefined ? req.query.ativo === 'true' : null
    };
    
    const result = await cardRepository.findWithPagination(userId, options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  /**
   * Busca estatísticas de cartões
   */
  getCardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const stats = await cardRepository.getStatsByUser(userId);
    
    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Busca cartões próximos do vencimento
   */
  getNearDueDateCards = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;
    
    const cards = await cardRepository.findNearDueDate(userId, days);
    
    res.json({
      success: true,
      data: cards
    });
  });

  /**
   * Busca cartões por bandeira
   */
  getCardsByBrand = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { bandeira } = req.params;
    
    const cards = await cardRepository.findByBrand(userId, bandeira);
    
    res.json({
      success: true,
      data: cards
    });
  });

  /**
   * Busca gastos mensais do cartão
   */
  getMonthlyExpenses = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { ano, mes } = req.query;
    const userId = req.user._id;
    
    // Verificar se o cartão existe e pertence ao usuário
    const existingCard = await cardRepository.findById(id);
    if (!existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }
    
    if (existingCard.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const currentYear = parseInt(ano) || new Date().getFullYear();
    const currentMonth = parseInt(mes) || new Date().getMonth() + 1;
    
    const expenses = await cardRepository.getMonthlyExpenses(id, currentYear, currentMonth);
    
    res.json({
      success: true,
      data: {
        cartao: existingCard,
        ano: currentYear,
        mes: currentMonth,
        gastos: expenses
      }
    });
  });

  /**
   * Busca cartões com limite baixo
   */
  getLowLimitCards = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const threshold = parseInt(req.query.threshold) || 80;
    
    const cards = await cardRepository.findLowLimit(userId, threshold);
    
    res.json({
      success: true,
      data: cards
    });
  });

  /**
   * Busca resumo por bandeira
   */
  getSummaryByBrand = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const summary = await cardRepository.getSummaryByBrand(userId);
    
    res.json({
      success: true,
      data: summary
    });
  });
}

module.exports = new CardController();

