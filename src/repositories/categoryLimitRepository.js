const { Limit } = require('../models');

class CategoryLimitRepository {
  async findByUser(userId) {
    return Limit.find({ user: userId, tipo: 'categoria', ativo: true })
      .populate('categoria', 'nome icone')
      .lean();
  }

  async upsert(userId, categoriaId, valor) {
    return Limit.findOneAndUpdate(
      { user: userId, categoria: categoriaId, tipo: 'categoria' },
      { valorLimite: valor, ativo: true, tipo: 'categoria', categoria: categoriaId, categoriaId },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async deleteByCategoryName(userId, categoryName) {
    return Limit.findOneAndDelete({ user: userId, tipo: 'categoria' })
      .populate({ path: 'categoria', match: { nome: categoryName } });
  }
}

module.exports = new CategoryLimitRepository();
