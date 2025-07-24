const { transactionRepository } = require('../repositories');
const { asyncHandler } = require('../middlewares/errorHandler');

class TransactionController {
  /**
   * Lista todas as transações do usuário
   */
  getTransactions = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'data',
      sortOrder: req.query.sortOrder || 'desc',
      search: req.query.search || '',
      tipo: req.query.tipo || null,
      categoriaId: req.query.categoriaId || null,
      cartaoId: req.query.cartaoId || null,
      status: req.query.status || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      valorMin: req.query.valorMin ? parseFloat(req.query.valorMin) : null,
      valorMax: req.query.valorMax ? parseFloat(req.query.valorMax) : null
    };
    
    const result = await transactionRepository.findWithPagination(userId, options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  /**
   * Busca transação por ID
   */
  getTransactionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    const transaction = await transactionRepository.findById(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }
    
    if (transaction.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  });

  /**
   * Cria uma nova transação
   */
  createTransaction = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const data = { ...req.body, user: userId };
    // Garante que só o campo categoria é usado
    if (data.categoria_id) {
      data.categoria = data.categoria_id;
      delete data.categoria_id;
    }
    if (data.categoriaId) {
      data.categoria = data.categoriaId;
      delete data.categoriaId;
    }
    const transaction = await transactionRepository.create(data);
    res.status(201).json({
      success: true,
      message: 'Transação criada com sucesso',
      data: transaction
    });
  });

  /**
   * Cria múltiplas transações
   */
  createBulkTransactions = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { transactions } = req.body;
    
    const transactionsData = transactions.map(transaction => ({
      ...transaction,
      user: userId
    }));
    
    const createdTransactions = await transactionRepository.createMany(transactionsData);
    
    res.status(201).json({
      success: true,
      message: `${createdTransactions.length} transações criadas com sucesso`,
      data: createdTransactions
    });
  });

  /**
   * Atualiza uma transação
   */
  updateTransaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const data = { ...req.body };
    // Garante que só o campo categoria é usado
    if (data.categoria_id) {
      data.categoria = data.categoria_id;
      delete data.categoria_id;
    }
    if (data.categoriaId) {
      data.categoria = data.categoriaId;
      delete data.categoriaId;
    }
    const transaction = await transactionRepository.update(id, data, userId);
    res.json({
      success: true,
      message: 'Transação atualizada com sucesso',
      data: transaction
    });
  });

  /**
   * Deleta uma transação
   */
  deleteTransaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await transactionRepository.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }
    
    if (existingTransaction.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    await transactionRepository.delete(id);
    
    res.json({
      success: true,
      message: 'Transação deletada com sucesso'
    });
  });

  /**
   * Busca resumo financeiro
   */
  getFinancialSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const summary = await transactionRepository.getFinancialSummary(userId, start, end);
    
    res.json({
      success: true,
      data: summary
    });
  });

  /**
   * Busca transações por categoria
   */
  getTransactionsByCategory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const categories = await transactionRepository.getByCategory(userId, start, end);
    
    res.json({
      success: true,
      data: categories
    });
  });

  /**
   * Busca fluxo de caixa mensal
   */
  getMonthlyCashFlow = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    const cashFlow = await transactionRepository.getMonthlyCashFlow(userId, year);
    
    res.json({
      success: true,
      data: cashFlow
    });
  });

  /**
   * Busca estatísticas de transações
   */
  getTransactionStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const stats = await transactionRepository.getStatsByUser(userId);
    
    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Busca transações recentes
   */
  getRecentTransactions = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;
    
    const transactions = await transactionRepository.findRecent(userId, limit);
    
    res.json({
      success: true,
      data: transactions
    });
  });
}

module.exports = new TransactionController();

