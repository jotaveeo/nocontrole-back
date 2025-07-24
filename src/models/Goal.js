const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  nome: {
    type: String,
    required: [true, 'Nome da meta é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  valorAlvo: {
    type: Number,
    required: [true, 'Valor alvo é obrigatório'],
    min: [0, 'Valor alvo deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  valorAtual: {
    type: Number,
    default: 0,
    min: [0, 'Valor atual deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  prazo: {
    type: Date,
    required: [true, 'Prazo é obrigatório']
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
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
goalSchema.index({ user: 1, ativo: 1 });
goalSchema.index({ user: 1, prazo: 1 });

// Virtual para progresso da meta
goalSchema.virtual('progresso').get(function() {
  if (this.valorAlvo === 0) return 0;
  return Math.min((this.valorAtual / this.valorAlvo) * 100, 100);
});

// Virtual para verificar se a meta foi atingida
goalSchema.virtual('atingida').get(function() {
  return this.valorAtual >= this.valorAlvo;
});

// Virtual para dias restantes
goalSchema.virtual('diasRestantes').get(function() {
  const hoje = new Date();
  const prazo = new Date(this.prazo);
  const diffTime = prazo - hoje;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Middleware para sincronizar campos categoria/categoriaId
goalSchema.pre('save', function(next) {
  if (this.categoria && !this.categoriaId) {
    this.categoriaId = this.categoria;
  } else if (this.categoriaId && !this.categoria) {
    this.categoria = this.categoriaId;
  }
  next();
});

// Método estático para buscar metas ativas do usuário
goalSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ prazo: 1 });
};

// Método para atualizar progresso da meta
goalSchema.methods.updateProgress = function(valor) {
  this.valorAtual = Math.max(0, this.valorAtual + valor);
  return this.save();
};

// Método para definir progresso da meta
goalSchema.methods.setProgress = function(valor) {
  this.valorAtual = Math.max(0, valor);
  return this.save();
};

module.exports = mongoose.model('Goal', goalSchema);

