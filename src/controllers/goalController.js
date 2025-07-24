const { goalRepository } = require('../repositories');
const { asyncHandler } = require('../middlewares/errorHandler');

class GoalController {
  /**
   * Lista todas as metas do usuário
   */
  getGoals = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { ativo } = req.query;
    
    const filters = {};
    if (ativo !== undefined) filters.ativo = ativo === 'true';
    
    const goals = await goalRepository.findByUser(userId, filters);
    
    res.json({
      success: true,
      data: goals
    });
  });

  /**
   * Lista metas ativas do usuário
   */
  getActiveGoals = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const goals = await goalRepository.findActiveByUser(userId);
    
    res.json({
      success: true,
      data: goals
    });
  });

  /**
   * Busca meta por ID
   */
  getGoalById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    const goal = await goalRepository.findById(id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    if (goal.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    res.json({
      success: true,
      data: goal
    });
  });

  /**
   * Cria uma nova meta
   */
  createGoal = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const goalData = {
      ...req.body,
      user: userId
    };
    
    const goal = await goalRepository.create(goalData);
    
    res.status(201).json({
      success: true,
      message: 'Meta criada com sucesso',
      data: goal
    });
  });

  /**
   * Atualiza uma meta
   */
  updateGoal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Verificar se a meta existe e pertence ao usuário
    const existingGoal = await goalRepository.findById(id);
    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    if (existingGoal.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const goal = await goalRepository.update(id, req.body);
    
    res.json({
      success: true,
      message: 'Meta atualizada com sucesso',
      data: goal
    });
  });

  /**
   * Deleta uma meta (soft delete)
   */
  deleteGoal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Verificar se a meta existe e pertence ao usuário
    const existingGoal = await goalRepository.findById(id);
    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    if (existingGoal.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const goal = await goalRepository.delete(id);
    
    res.json({
      success: true,
      message: 'Meta deletada com sucesso',
      data: goal
    });
  });

  /**
   * Atualiza progresso da meta
   */
  updateProgress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { valor } = req.body;
    const userId = req.user._id;
    
    // Verificar se a meta existe e pertence ao usuário
    const existingGoal = await goalRepository.findById(id);
    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    if (existingGoal.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const goal = await goalRepository.updateProgress(id, valor);
    
    res.json({
      success: true,
      message: 'Progresso da meta atualizado com sucesso',
      data: goal
    });
  });

  /**
   * Define progresso da meta
   */
  setProgress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { valor } = req.body;
    const userId = req.user._id;
    
    // Verificar se a meta existe e pertence ao usuário
    const existingGoal = await goalRepository.findById(id);
    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    if (existingGoal.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const goal = await goalRepository.setProgress(id, valor);
    
    res.json({
      success: true,
      message: 'Progresso da meta definido com sucesso',
      data: goal
    });
  });

  /**
   * Busca metas com paginação
   */
  getGoalsWithPagination = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'prazo',
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      ativo: req.query.ativo !== undefined ? req.query.ativo === 'true' : null
    };
    
    const result = await goalRepository.findWithPagination(userId, options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  /**
   * Busca estatísticas de metas
   */
  getGoalStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const stats = await goalRepository.getStatsByUser(userId);
    
    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Busca metas próximas do vencimento
   */
  getNearDeadlineGoals = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;
    
    const goals = await goalRepository.findNearDeadline(userId, days);
    
    res.json({
      success: true,
      data: goals
    });
  });

  /**
   * Busca metas por categoria
   */
  getGoalsByCategory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { categoriaId } = req.params;
    
    const goals = await goalRepository.findByCategory(userId, categoriaId);
    
    res.json({
      success: true,
      data: goals
    });
  });
}

module.exports = new GoalController();

