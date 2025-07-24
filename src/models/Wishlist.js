const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  nome: {
    type: String,
    required: [true, 'Nome do item é obrigatório'],
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
  valorEconomizado: {
    type: Number,
    default: 0,
    min: [0, 'Valor economizado deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  prioridade: {
    type: Number,
    enum: {
      values: [1, 2, 3, 4],
      message: 'Prioridade inválida'
    },
    default: 2
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  link: {
    type: String,
    trim: true,
    maxlength: [500, 'Link não pode ter mais de 500 caracteres']
  },
  imagem: {
    type: String,
    trim: true
  },
  dataDesejada: {
    type: Date,
    default: null
  },
  dataCompra: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['desejando', 'economizando', 'comprado', 'cancelado'],
      message: 'Status inválido'
    },
    default: 'desejando'
  },
  ativo: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag não pode ter mais de 50 caracteres']
  }]
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
wishlistSchema.index({ user: 1, ativo: 1 });
wishlistSchema.index({ user: 1, status: 1 });
wishlistSchema.index({ user: 1, prioridade: 1 });

// Virtual para progresso da economia
wishlistSchema.virtual('progresso').get(function() {
  if (this.valor === 0) return 0;
  return Math.min((this.valorEconomizado / this.valor) * 100, 100);
});

// Virtual para valor restante
wishlistSchema.virtual('valorRestante').get(function() {
  return Math.max(0, this.valor - this.valorEconomizado);
});

// Virtual para verificar se a meta foi atingida
wishlistSchema.virtual('metaAtingida').get(function() {
  return this.valorEconomizado >= this.valor;
});

// Virtual para dias até data desejada
wishlistSchema.virtual('diasDesejada').get(function() {
  if (!this.dataDesejada) return null;
  const hoje = new Date();
  const desejada = new Date(this.dataDesejada);
  const diffTime = desejada - hoje;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual para verificar se passou da data desejada
wishlistSchema.virtual('atrasado').get(function() {
  if (!this.dataDesejada) return false;
  return this.diasDesejada < 0 && this.status !== 'comprado';
});

// Middleware para sincronizar campos categoria/categoriaId
wishlistSchema.pre('save', function(next) {
  // Prioridade já normalizada no controller, não precisa tratar aqui
  // Atualizar status baseado no progresso
  if (this.valorEconomizado >= this.valor && this.status === 'economizando') {
    this.status = 'comprado';
    this.dataCompra = new Date();
  }
  next();
});

// Método estático para buscar itens ativos do usuário
wishlistSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, ativo: true })
    .populate('categoria', 'nome cor icone')
    .sort({ prioridade: 1, createdAt: -1 });
};

// Método estático para buscar por status
wishlistSchema.statics.findByStatus = function(userId, status) {
  return this.find({ user: userId, status, ativo: true })
    .populate('categoria', 'nome cor icone')
    .sort({ prioridade: 1, createdAt: -1 });
};

// Método estático para buscar por prioridade
wishlistSchema.statics.findByPriority = function(userId, prioridade) {
  return this.find({ user: userId, prioridade, ativo: true })
    .populate('categoria', 'nome cor icone')
    .sort({ createdAt: -1 });
};

// Método para adicionar valor economizado
wishlistSchema.methods.adicionarEconomia = function(valor) {
  this.valorEconomizado = Math.min(this.valor, this.valorEconomizado + valor);
  
  if (this.valorEconomizado >= this.valor) {
    this.status = 'comprado';
    this.dataCompra = new Date();
  } else if (this.status === 'desejando') {
    this.status = 'economizando';
  }
  
  return this.save();
};

// Método para marcar como comprado
wishlistSchema.methods.marcarComoComprado = function() {
  this.status = 'comprado';
  this.dataCompra = new Date();
  this.valorEconomizado = this.valor;
  return this.save();
};

// Método estático para estatísticas da wishlist
wishlistSchema.statics.getStatsByUser = async function(userId) {
  const [total, desejando, economizando, comprados, cancelados] = await Promise.all([
    this.countDocuments({ user: userId, ativo: true }),
    this.countDocuments({ user: userId, status: 'desejando', ativo: true }),
    this.countDocuments({ user: userId, status: 'economizando', ativo: true }),
    this.countDocuments({ user: userId, status: 'comprado', ativo: true }),
    this.countDocuments({ user: userId, status: 'cancelado', ativo: true })
  ]);

  // Calcular valores totais
  const valorResult = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        ativo: true
      }
    },
    {
      $group: {
        _id: '$status',
        totalValor: { $sum: '$valor' },
        totalEconomizado: { $sum: '$valorEconomizado' }
      }
    }
  ]);

  const valores = {
    totalDesejado: 0,
    totalEconomizado: 0,
    totalComprado: 0
  };

  valorResult.forEach(item => {
    if (item._id === 'desejando' || item._id === 'economizando') {
      valores.totalDesejado += item.totalValor;
      valores.totalEconomizado += item.totalEconomizado;
    } else if (item._id === 'comprado') {
      valores.totalComprado += item.totalValor;
    }
  });

  return {
    total,
    desejando,
    economizando,
    comprados,
    cancelados,
    ...valores
  };
};

// Método estático para buscar itens próximos da meta
wishlistSchema.statics.findNearGoal = function(userId, threshold = 80) {
  return this.find({
    user: userId,
    ativo: true,
    status: 'economizando'
  })
    .populate('categoria', 'nome cor icone')
    .then(items => {
      return items.filter(item => item.progresso >= threshold);
    });
};

module.exports = mongoose.model('Wishlist', wishlistSchema);

