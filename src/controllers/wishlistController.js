const { wishlistRepository } = require('../repositories');
const { asyncHandler } = require('../middlewares/errorHandler');
const mongoose = require('mongoose');

class WishlistController {
  /**
   * Lista todos os itens da wishlist do usuário
   */
  getWishlistItems = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { status, prioridade, ativo } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (prioridade) filters.prioridade = prioridade;
    if (ativo !== undefined) filters.ativo = ativo === 'true';
    
    const items = await wishlistRepository.findByUser(userId, filters);
    
    res.json({
      success: true,
      data: items
    });
  });

  /**
   * Lista itens ativos da wishlist do usuário
   */
  getActiveWishlistItems = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const items = await wishlistRepository.findActiveByUser(userId);
    
    res.json({
      success: true,
      data: items
    });
  });

  /**
   * Busca item da wishlist por ID
   */
  getWishlistItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    const item = await wishlistRepository.findById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item da wishlist não encontrado'
      });
    }
    
    if (item.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  });

  /**
   * Busca itens por status
   */
  getWishlistItemsByStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { status } = req.params;
    
    const items = await wishlistRepository.findByStatus(userId, status);
    
    res.json({
      success: true,
      data: items
    });
  });

  /**
   * Busca itens por prioridade
   */
  getWishlistItemsByPriority = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { prioridade } = req.params;
    
    const items = await wishlistRepository.findByPriority(userId, prioridade);
    
    res.json({
      success: true,
      data: items
    });
  });

  /**
   * Cria um novo item da wishlist
   */
  createWishlistItem = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const data = { ...req.body, user: userId };
    // Mapeia categoria_id do payload para categoria no banco
    if (data.categoria_id) {
      if (!mongoose.Types.ObjectId.isValid(data.categoria_id)) {
        return res.status(400).json({ success: false, message: 'ID de categoria inválido' });
      }
      data.categoria = data.categoria_id;
      delete data.categoria_id;
    }
    // Mapeia item para nome
    if (data.item) {
      data.nome = data.item;
      delete data.item;
    }
        // Normaliza prioridade para valores numéricos
        if (data.prioridade !== undefined) {
            const map = {
                'baixa': 1,
                'media': 2,
                'média': 2,
                'Média': 2,
                'Media': 2,
                'alta': 3,
                'Alta': 3,
                'urgente': 4,
                'Urgente': 4,
                1: 1,
                2: 2,
                3: 3,
                4: 4
            };
            let prioridadeVal = data.prioridade;
            if (typeof prioridadeVal === 'string' && map[prioridadeVal.toLowerCase()]) {
                data.prioridade = map[prioridadeVal.toLowerCase()];
            } else if (!isNaN(prioridadeVal)) {
                data.prioridade = map[Number(prioridadeVal)] || Number(prioridadeVal);
            }
        }
    const item = await wishlistRepository.create(data);
    res.status(201).json({
      success: true,
      message: 'Item criado com sucesso',
      data: item
    });
  });

  /**
   * Atualiza um item da wishlist
   */
  updateWishlistItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const data = { ...req.body };
    // Mapeia categoria_id do payload para categoria no banco
    if (data.categoria_id) {
      if (!mongoose.Types.ObjectId.isValid(data.categoria_id)) {
        return res.status(400).json({ success: false, message: 'ID de categoria inválido' });
      }
      data.categoria = data.categoria_id;
      delete data.categoria_id;
    }
    // Mapeia item para nome
    if (data.item) {
      data.nome = data.item;
      delete data.item;
    }
        // Normaliza prioridade para valores numéricos
        if (data.prioridade !== undefined) {
            const map = {
                'baixa': 1,
                'media': 2,
                'média': 2,
                'Média': 2,
                'Media': 2,
                'alta': 3,
                'Alta': 3,
                'urgente': 4,
                'Urgente': 4,
                1: 1,
                2: 2,
                3: 3,
                4: 4
            };
            let prioridadeVal = data.prioridade;
            if (typeof prioridadeVal === 'string' && map[prioridadeVal.toLowerCase()]) {
                data.prioridade = map[prioridadeVal.toLowerCase()];
            } else if (!isNaN(prioridadeVal)) {
                data.prioridade = map[Number(prioridadeVal)] || Number(prioridadeVal);
            }
        }
    const item = await wishlistRepository.update(id, data, userId);
    res.json({
      success: true,
      message: 'Item atualizado com sucesso',
      data: item
    });
  });

  /**
   * Deleta um item da wishlist (soft delete)
   */
  deleteWishlistItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Verificar se o item existe e pertence ao usuário
    const existingItem = await wishlistRepository.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item da wishlist não encontrado'
      });
    }
    
    if (existingItem.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const item = await wishlistRepository.delete(id);
    
    res.json({
      success: true,
      message: 'Item da wishlist deletado com sucesso',
      data: item
    });
  });

  /**
   * Adiciona valor economizado ao item
   */
  addSavings = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { valor } = req.body;
    const userId = req.user._id;
    
    // Verificar se o item existe e pertence ao usuário
    const existingItem = await wishlistRepository.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item da wishlist não encontrado'
      });
    }
    
    if (existingItem.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const item = await wishlistRepository.addSavings(id, valor);
    
    res.json({
      success: true,
      message: 'Economia adicionada com sucesso',
      data: item
    });
  });

  /**
   * Marca item como comprado
   */
  markAsPurchased = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Verificar se o item existe e pertence ao usuário
    const existingItem = await wishlistRepository.findById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item da wishlist não encontrado'
      });
    }
    
    if (existingItem.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const item = await wishlistRepository.markAsPurchased(id);
    
    res.json({
      success: true,
      message: 'Item marcado como comprado com sucesso',
      data: item
    });
  });

  /**
   * Busca itens com paginação
   */
  getWishlistItemsWithPagination = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'prioridade',
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      status: req.query.status || null,
      prioridade: req.query.prioridade || null,
      ativo: req.query.ativo !== undefined ? req.query.ativo === 'true' : null
    };
    
    const result = await wishlistRepository.findWithPagination(userId, options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  /**
   * Busca estatísticas da wishlist
   */
  getWishlistStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const stats = await wishlistRepository.getStatsByUser(userId);
    
    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Busca itens próximos da meta
   */
  getNearGoalItems = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const threshold = parseInt(req.query.threshold) || 80;
    
    const items = await wishlistRepository.findNearGoal(userId, threshold);
    
    res.json({
      success: true,
      data: items
    });
  });

  /**
   * Busca itens por categoria
   */
  getWishlistItemsByCategory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { categoriaId } = req.params;
    
    const items = await wishlistRepository.findByCategory(userId, categoriaId);
    
    res.json({
      success: true,
      data: items
    });
  });

  /**
   * Busca itens atrasados
   */
  getOverdueItems = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const items = await wishlistRepository.findOverdue(userId);
    
    res.json({
      success: true,
      data: items
    });
  });

  /**
   * Busca resumo por prioridade
   */
  getSummaryByPriority = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const summary = await wishlistRepository.getSummaryByPriority(userId);
    
    res.json({
      success: true,
      data: summary
    });
  });
}

module.exports = new WishlistController();

