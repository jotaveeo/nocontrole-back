const { Limit, Category, Transaction } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');

class CategoryLimitController {
  // Lista todos os limites de categoria do usuário autenticado
  getCategoryLimits = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;
    const start = new Date(ano, mes - 1, 1);
    const end = new Date(ano, mes, 0, 23, 59, 59);

    // Buscar todas as categorias do usuário
    const categories = await Category.find({ user: userId }).lean();

    // Buscar limites do tipo categoria
    const limits = await Limit.find({ user: userId, tipo: 'categoria', ativo: true })
      .populate({ path: 'categoria', select: 'nome icone' })
      .lean();

    // Buscar gastos do mês por categoria
    const transactions = await Transaction.aggregate([
      { $match: { user: userId, tipo: 'despesa', data: { $gte: start, $lte: end } } },
      { $group: { _id: '$categoria', total: { $sum: '$valor' }, count: { $sum: 1 } } }
    ]);
    const gastosPorCategoria = {};
    transactions.forEach(t => {
      gastosPorCategoria[t._id?.toString()] = { spent: t.total, transactions: t.count };
    });

    // Mapear limites por categoriaId para lookup rápido
    const limitByCategory = {};
    limits.forEach(limit => {
      const catId = (limit.categoria?._id || limit.categoriaId || limit.categoria)?.toString();
      limitByCategory[catId] = limit;
    });

    // Montar resposta apenas para categorias do tipo 'expense'
    const response = categories
      .filter(cat => cat.tipo === 'despesa' || cat.type === 'expense')
      .map(cat => {
        const catId = cat._id.toString();
        const limit = limitByCategory[catId];
        const spent = gastosPorCategoria[catId]?.spent || 0;
        const transactions = gastosPorCategoria[catId]?.transactions || 0;
        const budget = limit ? (limit.valorLimite || 0) : 0;
        const remaining = Math.max(0, budget - spent);
        const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        let status = 'safe';
        if (percentage >= 100) status = 'exceeded';
        else if (percentage >= 80) status = 'warning';
        // Busca nome e ícone da categoria, priorizando o que está salvo no limite, se houver
        const name = (limit && limit.categoria && limit.categoria.nome) ? limit.categoria.nome : (cat.nome || 'Categoria');
        const icon = (limit && limit.categoria && limit.categoria.icone) ? limit.categoria.icone : (cat.icone || null);
        return {
          id: limit ? limit._id : cat._id,
          name,
          icon,
          budget,
          spent,
          remaining,
          percentage,
          transactions,
          status
        };
      });
    res.json({ success: true, data: response });
  });

  // Cria ou atualiza limite de categoria
  upsertCategoryLimit = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    let { categoriaId, valor } = req.body;
    if (!categoriaId || !valor || valor <= 0) {
      return res.status(400).json({ success: false, message: 'Categoria e valor (>0) são obrigatórios.' });
    }
    // Garante que categoriaId é um ObjectId válido
    if (typeof categoriaId === 'string' && categoriaId.length === 24) {
      // ok
    } else {
      return res.status(400).json({ success: false, message: 'ID da categoria inválido.' });
    }
    let limit = await Limit.findOneAndUpdate(
      { user: userId, categoria: categoriaId, tipo: 'categoria' },
      { valorLimite: valor, ativo: true, tipo: 'categoria', categoria: categoriaId, categoriaId },
      { new: true, upsert: true, runValidators: true }
    );
    // Buscar nome e ícone da categoria
    const category = await Category.findById(categoriaId).lean();
    // Buscar gastos do mês para essa categoria
    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;
    const start = new Date(ano, mes - 1, 1);
    const end = new Date(ano, mes, 0, 23, 59, 59);
    const transactions = await Transaction.aggregate([
      { $match: { user: userId, tipo: 'despesa', categoria: limit.categoria, data: { $gte: start, $lte: end } } },
      { $group: { _id: '$categoria', total: { $sum: '$valor' }, count: { $sum: 1 } } }
    ]);
    const spent = transactions[0]?.total || 0;
    const transactionsCount = transactions[0]?.count || 0;
    const budget = limit.valorLimite || 0;
    const remaining = Math.max(0, budget - spent);
    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    let status = 'safe';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';
    res.status(201).json({
      success: true,
      data: {
        id: limit._id,
        name: (category && category.nome) ? category.nome : (limit.nome || 'Categoria'),
        icon: (category && category.icone) ? category.icone : (limit.icone || null),
        budget,
        spent,
        remaining,
        percentage,
        transactions: transactionsCount,
        status
      }
    });
  });

  // Remove limite de categoria
  deleteCategoryLimit = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { categoryName } = req.params;
    const category = await Category.findOne({ nome: categoryName });
    if (!category) return res.status(404).json({ success: false, message: 'Categoria não encontrada.' });
    await Limit.findOneAndDelete({ user: userId, categoria: category._id, tipo: 'categoria' });
    res.json({ success: true });
  });
}

module.exports = new CategoryLimitController();
