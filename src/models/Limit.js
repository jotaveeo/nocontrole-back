const mongoose = require('mongoose');

const limitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  nome: {
    type: String,
    required: [true, 'Nome do limite é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  tipo: {
    type: String,
    required: [true, 'Tipo do limite é obrigatório'],
    enum: {
      values: ['categoria', 'cartao', 'geral', 'periodo'],
      message: 'Tipo de limite inválido'
    }
  },
  valorLimite: {
    type: Number,
    required: [true, 'Valor do limite é obrigatório'],
    min: [0, 'Valor do limite deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  valorGasto: {
    type: Number,
    default: 0,
    min: [0, 'Valor gasto deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  periodo: {
    type: String,
    required: [true, 'Período é obrigatório'],
    enum: {
      values: ['diario', 'semanal', 'mensal', 'anual'],
      message: 'Período inválido'
    },
    default: 'mensal'
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
  ativo: {
    type: Boolean,
    default: true
  },
  alertas: {
    percentual50: {
      type: Boolean,
      default: true
    },
    percentual75: {
      type: Boolean,
      default: true
    },
    percentual90: {
      type: Boolean,
      default: true
    },
    percentual100: {
      type: Boolean,
      default: true
    }
  },
  ultimoReset: {
    type: Date,
    default: Date.now
  },
  proximoReset: {
    type: Date,
    default: null
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
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
limitSchema.index({ user: 1, ativo: 1 });
limitSchema.index({ user: 1, tipo: 1 });
limitSchema.index({ user: 1, categoriaId: 1 });
limitSchema.index({ user: 1, cartaoId: 1 });

// Virtual para percentual usado
limitSchema.virtual('percentualUsado').get(function() {
  if (this.valorLimite === 0) return 0;
  return Math.min((this.valorGasto / this.valorLimite) * 100, 100);
});

// Virtual para valor restante
limitSchema.virtual('valorRestante').get(function() {
  return Math.max(0, this.valorLimite - this.valorGasto);
});

// Virtual para verificar se excedeu o limite
limitSchema.virtual('excedido').get(function() {
  return this.valorGasto > this.valorLimite;
});

// Virtual para status do limite
limitSchema.virtual('status').get(function() {
  const percentual = this.percentualUsado;
  
  if (percentual >= 100) return 'excedido';
  if (percentual >= 90) return 'critico';
  if (percentual >= 75) return 'alerta';
  if (percentual >= 50) return 'atencao';
  return 'normal';
});

// Virtual para próximo reset calculado
limitSchema.virtual('proximoResetCalculado').get(function() {
  const ultimoReset = new Date(this.ultimoReset);
  const proximo = new Date(ultimoReset);
  
  switch (this.periodo) {
    case 'diario':
      proximo.setDate(proximo.getDate() + 1);
      break;
    case 'semanal':
      proximo.setDate(proximo.getDate() + 7);
      break;
    case 'mensal':
      proximo.setMonth(proximo.getMonth() + 1);
      break;
    case 'anual':
      proximo.setFullYear(proximo.getFullYear() + 1);
      break;
  }
  
  return proximo;
});

// Middleware para sincronizar campos categoria/categoriaId e cartao/cartaoId
limitSchema.pre('save', function(next) {
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
  
  // Calcular próximo reset
  this.proximoReset = this.proximoResetCalculado;
  
  next();
});

// Método estático para buscar limites ativos do usuário
limitSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .populate('cartao', 'nome bandeira')
    .populate('cartaoId', 'nome bandeira')
    .sort({ createdAt: -1 });
};

// Método estático para buscar por tipo
limitSchema.statics.findByType = function(userId, tipo) {
  return this.find({ user: userId, tipo, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .populate('cartao', 'nome bandeira')
    .populate('cartaoId', 'nome bandeira')
    .sort({ createdAt: -1 });
};

// Método para adicionar gasto
limitSchema.methods.adicionarGasto = function(valor) {
  this.valorGasto += valor;
  return this.save();
};

// Método para resetar limite
limitSchema.methods.resetar = function() {
  this.valorGasto = 0;
  this.ultimoReset = new Date();
  this.proximoReset = this.proximoResetCalculado;
  return this.save();
};

// Método estático para verificar limites que precisam ser resetados
limitSchema.statics.findToReset = function() {
  const agora = new Date();
  return this.find({
    ativo: true,
    proximoReset: { $lte: agora }
  });
};

// Método estático para buscar limites em alerta
limitSchema.statics.findInAlert = function(userId) {
  return this.find({ user: userId, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .populate('cartao', 'nome bandeira')
    .populate('cartaoId', 'nome bandeira')
    .then(limits => {
      return limits.filter(limit => {
        const percentual = limit.percentualUsado;
        return percentual >= 50; // Retorna limites com 50% ou mais de uso
      });
    });
};

// Método estático para estatísticas de limites
limitSchema.statics.getStatsByUser = async function(userId) {
  const [total, ativos, excedidos, emAlerta] = await Promise.all([
    this.countDocuments({ user: userId }),
    this.countDocuments({ user: userId, ativo: true }),
    this.countDocuments({ user: userId, ativo: true }).then(async () => {
      const limits = await this.find({ user: userId, ativo: true });
      return limits.filter(limit => limit.excedido).length;
    }),
    this.countDocuments({ user: userId, ativo: true }).then(async () => {
      const limits = await this.find({ user: userId, ativo: true });
      return limits.filter(limit => limit.percentualUsado >= 75).length;
    })
  ]);

  return {
    total,
    ativos,
    excedidos,
    emAlerta
  };
};

// Método estático para atualizar gastos baseado em transações
limitSchema.statics.updateFromTransactions = async function(userId, categoriaId = null, cartaoId = null, valor = 0) {
  const query = { user: userId, ativo: true };
  
  // Buscar limites que se aplicam
  const limits = await this.find({
    $or: [
      { ...query, tipo: 'geral' },
      { ...query, tipo: 'categoria', categoriaId },
      { ...query, tipo: 'cartao', cartaoId }
    ]
  });
  
  // Atualizar cada limite aplicável
  for (const limit of limits) {
    limit.valorGasto += Math.abs(valor);
    await limit.save();
  }
  
  return limits;
};

module.exports = mongoose.model('Limit', limitSchema);

