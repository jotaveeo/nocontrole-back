const { categoryRepository } = require('../repositories');
const { asyncHandler } = require('../middlewares/errorHandler');

class CategoryController {
  /**
   * Lista todas as categorias do usuário
   */
  getCategories = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { tipo, ativo } = req.query;
    
    const filters = {};
    if (tipo) filters.tipo = tipo;
    // Por padrão, buscar apenas categorias ativas (ativo !== 'false')
    filters.ativo = ativo === 'false' ? false : true;
    
    const categories = await categoryRepository.findByUser(userId, filters);
    
    res.json({
      success: true,
      data: categories
    });
  });

  /**
   * Busca categoria por ID
   */
  getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    const category = await categoryRepository.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    if (category.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  });

  /**
   * Cria uma nova categoria
   */
  createCategory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const categoryData = {
      ...req.body,
      user: userId
    };
    
    // Verificar se já existe categoria com o mesmo nome
    const existingCategory = await categoryRepository.findByNameAndUser(userId, req.body.nome);
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma categoria com este nome'
      });
    }
    
    const category = await categoryRepository.create(categoryData);
    
    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: category
    });
  });

  /**
   * Atualiza uma categoria
   */
  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Verificar se a categoria existe e pertence ao usuário
    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    if (existingCategory.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    // Verificar se o novo nome já existe (se fornecido)
    if (req.body.nome && req.body.nome !== existingCategory.nome) {
      const duplicateCategory = await categoryRepository.findByNameAndUser(userId, req.body.nome);
      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma categoria com este nome'
        });
      }
    }
    
    const category = await categoryRepository.update(id, req.body);
    
    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: category
    });
  });

  /**
   * Deleta uma categoria (soft delete)
   */
  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    console.log(`🗑️ Iniciando exclusão da categoria: ${id} para usuário: ${userId}`);
    
    // Verificar se a categoria existe e pertence ao usuário
    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      console.log(`❌ Categoria ${id} não encontrada`);
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }
    
    if (existingCategory.user.toString() !== userId.toString()) {
      console.log(`🚫 Acesso negado para categoria ${id} - usuário ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    console.log(`📝 Categoria antes da exclusão - ativo: ${existingCategory.ativo}`);
    const category = await categoryRepository.delete(id);
    console.log(`✅ Categoria após exclusão - ativo: ${category.ativo}`);
    
    res.json({
      success: true,
      message: 'Categoria deletada com sucesso',
      data: category
    });
  });

  /**
   * Busca categorias com paginação
   */
  getCategoriesWithPagination = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'nome',
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      tipo: req.query.tipo || null,
      ativo: req.query.ativo !== undefined ? req.query.ativo === 'true' : null
    };
    
    const result = await categoryRepository.findWithPagination(userId, options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  /**
   * Busca estatísticas de categorias
   */
  getCategoryStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const stats = await categoryRepository.getStatsByUser(userId);
    
    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Busca categorias mais usadas
   */
  getMostUsedCategories = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;
    
    const categories = await categoryRepository.findMostUsed(userId, limit);
    
    res.json({
      success: true,
      data: categories
    });
  });

  /**
   * Cria categorias padrão para o usuário
   */
  createDefaultCategories = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // Verificar se o usuário já tem categorias
    const hasCategories = await categoryRepository.hasCategories(userId);
    if (hasCategories) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já possui categorias'
      });
    }
    
    const categories = await categoryRepository.createDefaultCategories(userId);
    
    res.status(201).json({
      success: true,
      message: 'Categorias padrão criadas com sucesso',
      data: categories
    });
  });

  /**
   * Apaga todas as categorias do usuário logado
   */
  deleteAllCategories = asyncHandler(async (req, res) => {
    console.log('--- [DELETE /api/categories/all] ---');
    console.log('Headers:', req.headers);
    console.log('req.user:', req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }
    const userId = req.user._id;
    try {
      const result = await categoryRepository.deleteAllByUser(userId);
      res.json({
        success: true,
        message: `Todas as categorias do usuário foram apagadas (${result.deletedCount})`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Erro ao apagar categorias:', error);
      res.status(400).json({ success: false, message: error.message, stack: error.stack });
    }
  });
}

module.exports = new CategoryController();

