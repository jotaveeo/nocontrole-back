const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  nome: {
    type: String,
    required: [true, 'Nome da categoria é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  tipo: {
    type: String,
    required: [true, 'Tipo da categoria é obrigatório'],
    enum: {
      values: ['receita', 'despesa'],
      message: 'Tipo de categoria inválido'
    }
  },
  cor: {
    type: String,
    default: '#6B7280',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor deve estar no formato hexadecimal']
  },
  icone: {
    type: String,
    default: 'folder'
  },
  ativo: {
    type: Boolean,
    default: true
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Índices
categorySchema.index({ user: 1, ativo: 1 });
categorySchema.index({ user: 1, tipo: 1 });
categorySchema.index({ user: 1, nome: 1 }, { unique: true });

// Virtual para transações da categoria
categorySchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'categoriaId'
});

// Método estático para buscar categorias ativas do usuário
categorySchema.statics.findActiveByUser = function(userId, tipo = null) {
  const query = { user: userId, ativo: true };
  if (tipo) query.tipo = tipo;
  
  return this.find(query).sort({ nome: 1 });
};

// Método para calcular total gasto na categoria no mês
categorySchema.methods.getMonthlySpent = async function(year, month) {
  const Transaction = mongoose.model('Transaction');
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const result = await Transaction.aggregate([
    {
      $match: {
        categoriaId: this._id,
        data: { $gte: startDate, $lte: endDate },
        tipo: 'despesa'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$valor' }
      }
    }
  ]);
  
  return result.length > 0 ? Math.abs(result[0].total) : 0;
};

module.exports = mongoose.model('Category', categorySchema);

