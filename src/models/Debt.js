const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  credor: {
    type: String,
    required: [true, 'Credor é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do credor não pode ter mais de 100 caracteres']
  },
  valorTotal: {
    type: Number,
    required: [true, 'Valor total é obrigatório'],
    min: [0, 'Valor total deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  valorPago: {
    type: Number,
    default: 0,
    min: [0, 'Valor pago deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  dataVencimento: {
    type: Date,
    required: [true, 'Data de vencimento é obrigatória']
  },
  juros: {
    type: Number,
    default: 0,
    min: [0, 'Juros deve ser positivo'],
    max: [100, 'Juros não pode ser maior que 100%']
  },
  parcelas: {
    type: Number,
    default: 1,
    min: [1, 'Número de parcelas deve ser pelo menos 1']
  },
  parcelaAtual: {
    type: Number,
    default: 0,
    min: [0, 'Parcela atual deve ser positiva']
  },
  status: {
    type: String,
    enum: {
      values: ['ativa', 'paga', 'vencida', 'negociada'],
      message: 'Status inválido'
    },
    default: 'ativa'
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
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
  proximaRevisao: {
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
debtSchema.index({ user: 1, status: 1 });
debtSchema.index({ user: 1, dataVencimento: 1 });

// Virtual para valor restante
debtSchema.virtual('valorRestante').get(function() {
  return Math.max(0, this.valorTotal - this.valorPago);
});

// Virtual para progresso do pagamento
debtSchema.virtual('progresso').get(function() {
  if (this.valorTotal === 0) return 100;
  return Math.min((this.valorPago / this.valorTotal) * 100, 100);
});

// Virtual para verificar se está vencida
debtSchema.virtual('vencida').get(function() {
  return new Date() > new Date(this.dataVencimento) && this.status === 'ativa';
});

// Virtual para dias até vencimento
debtSchema.virtual('diasVencimento').get(function() {
  const hoje = new Date();
  const vencimento = new Date(this.dataVencimento);
  const diffTime = vencimento - hoje;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Middleware para sincronizar campos categoria/categoriaId
debtSchema.pre('save', function(next) {
  if (this.categoria && !this.categoriaId) {
    this.categoriaId = this.categoria;
  } else if (this.categoriaId && !this.categoria) {
    this.categoria = this.categoriaId;
  }
  
  // Atualizar status baseado no pagamento
  if (this.valorPago >= this.valorTotal) {
    this.status = 'paga';
  } else if (this.status === 'paga' && this.valorPago < this.valorTotal) {
    this.status = 'ativa';
  }
  
  // Verificar se está vencida
  if (this.status === 'ativa' && new Date() > new Date(this.dataVencimento)) {
    this.status = 'vencida';
  }
  
  next();
});

// Método estático para buscar dívidas ativas do usuário
debtSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, status: { $in: ['ativa', 'vencida', 'negociada'] } })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ dataVencimento: 1 });
};

// Método para registrar pagamento
debtSchema.methods.registrarPagamento = function(valor) {
  this.valorPago = Math.min(this.valorTotal, this.valorPago + valor);
  this.parcelaAtual = Math.min(this.parcelas, this.parcelaAtual + 1);
  
  if (this.valorPago >= this.valorTotal) {
    this.status = 'paga';
  }
  
  return this.save();
};

module.exports = mongoose.model('Debt', debtSchema);

