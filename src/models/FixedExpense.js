const mongoose = require('mongoose');

const fixedExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  nome: {
    type: String,
    required: [true, 'Nome do gasto fixo é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  valor: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0, 'Valor deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  diaVencimento: {
    type: Number,
    required: [true, 'Dia de vencimento é obrigatório'],
    min: [1, 'Dia de vencimento deve ser entre 1 e 31'],
    max: [31, 'Dia de vencimento deve ser entre 1 e 31']
  },
  ativo: {
    type: Boolean,
    default: true
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
  observacoes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
  },
  ultimoPagamento: {
    type: Date,
    default: null
  },
  proximoVencimento: {
    type: Date,
    default: null
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
fixedExpenseSchema.index({ user: 1, ativo: 1 });
fixedExpenseSchema.index({ user: 1, diaVencimento: 1 });

// Virtual para próximo vencimento
fixedExpenseSchema.virtual('proximoVencimentoCalculado').get(function() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  
  let proximoVencimento = new Date(ano, mes, this.diaVencimento);
  
  // Se já passou do dia de vencimento neste mês, usar o próximo mês
  if (proximoVencimento <= hoje) {
    proximoVencimento = new Date(ano, mes + 1, this.diaVencimento);
  }
  
  return proximoVencimento;
});

// Virtual para dias até vencimento
fixedExpenseSchema.virtual('diasVencimento').get(function() {
  const hoje = new Date();
  const vencimento = this.proximoVencimentoCalculado;
  const diffTime = vencimento - hoje;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual para verificar se está vencido
fixedExpenseSchema.virtual('vencido').get(function() {
  return this.diasVencimento < 0;
});

// Middleware para sincronizar campos categoria/categoriaId
fixedExpenseSchema.pre('save', function(next) {
  if (this.categoria && !this.categoriaId) {
    this.categoriaId = this.categoria;
  } else if (this.categoriaId && !this.categoria) {
    this.categoria = this.categoriaId;
  }
  
  // Calcular próximo vencimento
  this.proximoVencimento = this.proximoVencimentoCalculado;
  
  next();
});

// Método estático para buscar gastos fixos ativos do usuário
fixedExpenseSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ diaVencimento: 1 });
};

// Método para registrar pagamento
fixedExpenseSchema.methods.registrarPagamento = function(data = new Date()) {
  this.ultimoPagamento = data;
  return this.save();
};

// Método estático para buscar vencimentos próximos
fixedExpenseSchema.statics.findUpcoming = function(userId, days = 7) {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(hoje.getDate() + days);
  
  return this.find({
    user: userId,
    ativo: true,
    proximoVencimento: { $lte: limite }
  })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ proximoVencimento: 1 });
};

module.exports = mongoose.model('FixedExpense', fixedExpenseSchema);

