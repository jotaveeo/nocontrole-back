const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  tipo: {
    type: String,
    required: [true, 'Tipo da transação é obrigatório'],
    enum: {
      values: ['receita', 'despesa'],
      message: 'Tipo de transação inválido'
    }
  },
  valor: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  descricao: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  data: {
    type: Date,
    required: [true, 'Data é obrigatória'],
    default: Date.now
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  categoriaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  cartao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  cartaoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    default: null
  },
  recorrente: {
    type: Boolean,
    default: false
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag não pode ter mais de 50 caracteres']
  }],
  anexos: [{
    type: String
  }],
  status: {
    type: String,
    enum: {
      values: ['pendente', 'confirmada', 'cancelada'],
      message: 'Status inválido'
    },
    default: 'confirmada'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    getters: true
  }
});

// Índices
transactionSchema.index({ user: 1, data: -1 });
transactionSchema.index({ categoriaId: 1, data: -1 });
transactionSchema.index({ cartaoId: 1, data: -1 });
transactionSchema.index({ user: 1, tipo: 1, data: -1 });
transactionSchema.index({ status: 1 });

// Middleware para sincronizar campos categoria/categoriaId
transactionSchema.pre('save', function(next) {
  if (this.categoria && !this.categoriaId) {
    this.categoriaId = this.categoria;
  } else if (this.categoriaId && !this.categoria) {
    this.categoria = this.categoriaId;
  }
  
  if (this.cartao && !this.cartaoId) {
    this.cartaoId = this.cartao;
  } else if (this.cartaoId && !this.cartao) {
    this.cartao = this.cartaoId;
  }
  
  next();
});

// Método estático para buscar transações do usuário
transactionSchema.statics.findByUser = function(userId, filters = {}) {
  const query = { user: userId, ...filters };
  
  return this.find(query)
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .populate('cartao', 'nome bandeira')
    .populate('cartaoId', 'nome bandeira')
    .sort({ data: -1 });
};

// Método estático para relatórios
transactionSchema.statics.getReport = function(userId, startDate, endDate, groupBy = 'categoria') {
  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
    data: { $gte: startDate, $lte: endDate },
    status: 'confirmada'
  };
  
  const groupField = groupBy === 'categoria' ? '$categoriaId' : `$${groupBy}`;
  
  const groupStage = {
    _id: groupField,
    total: { $sum: '$valor' },
    count: { $sum: 1 },
    avgAmount: { $avg: '$valor' }
  };
  
  return this.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { total: -1 } },
    {
      $lookup: {
        from: groupBy === 'categoria' ? 'categories' : 'cards',
        localField: '_id',
        foreignField: '_id',
        as: 'details'
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);

