const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  nome: {
    type: String,
    required: [true, 'Nome do investimento é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  tipo: {
    type: String,
    required: [true, 'Tipo do investimento é obrigatório'],
    enum: {
      values: ['renda_fixa', 'renda_variavel', 'fundos', 'criptomoedas', 'imoveis', 'outros'],
      message: 'Tipo de investimento inválido'
    }
  },
  valorInvestido: {
    type: Number,
    required: [true, 'Valor investido é obrigatório'],
    min: [0, 'Valor investido deve ser positivo'],
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
  dataInvestimento: {
    type: Date,
    required: [true, 'Data do investimento é obrigatória'],
    default: Date.now
  },
  dataVencimento: {
    type: Date,
    default: null
  },
  rentabilidade: {
    type: Number,
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  corretora: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome da corretora não pode ter mais de 100 caracteres']
  },
  ativo: {
    type: Boolean,
    default: true
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
investmentSchema.index({ user: 1, ativo: 1 });
investmentSchema.index({ user: 1, tipo: 1 });
investmentSchema.index({ user: 1, dataVencimento: 1 });

// Virtual para ganho/perda
investmentSchema.virtual('ganhoPerda').get(function() {
  return this.valorAtual - this.valorInvestido;
});

// Virtual para percentual de ganho/perda
investmentSchema.virtual('percentualGanhoPerda').get(function() {
  if (this.valorInvestido === 0) return 0;
  return ((this.valorAtual - this.valorInvestido) / this.valorInvestido) * 100;
});

// Virtual para verificar se está vencido
investmentSchema.virtual('vencido').get(function() {
  if (!this.dataVencimento) return false;
  return new Date() > new Date(this.dataVencimento);
});

// Virtual para dias até vencimento
investmentSchema.virtual('diasVencimento').get(function() {
  if (!this.dataVencimento) return null;
  const hoje = new Date();
  const vencimento = new Date(this.dataVencimento);
  const diffTime = vencimento - hoje;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual para tempo de investimento em dias
investmentSchema.virtual('tempoInvestimento').get(function() {
  const hoje = new Date();
  const inicio = new Date(this.dataInvestimento);
  const diffTime = hoje - inicio;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Middleware para sincronizar campos categoria/categoriaId
investmentSchema.pre('save', function(next) {
  if (this.categoria && !this.categoriaId) {
    this.categoriaId = this.categoria;
  } else if (this.categoriaId && !this.categoria) {
    this.categoria = this.categoriaId;
  }
  
  // Se valor atual não foi definido, usar valor investido
  if (this.valorAtual === 0 && this.valorInvestido > 0) {
    this.valorAtual = this.valorInvestido;
  }
  
  next();
});

// Método estático para buscar investimentos ativos do usuário
investmentSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ dataInvestimento: -1 });
};

// Método estático para buscar por tipo
investmentSchema.statics.findByType = function(userId, tipo) {
  return this.find({ user: userId, tipo, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ dataInvestimento: -1 });
};

// Método para atualizar valor atual
investmentSchema.methods.atualizarValor = function(novoValor) {
  this.valorAtual = novoValor;
  
  // Calcular rentabilidade
  if (this.valorInvestido > 0) {
    this.rentabilidade = ((this.valorAtual - this.valorInvestido) / this.valorInvestido) * 100;
  }
  
  return this.save();
};

// Método estático para calcular resumo de investimentos
investmentSchema.statics.getPortfolioSummary = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        ativo: true
      }
    },
    {
      $group: {
        _id: null,
        totalInvestido: { $sum: '$valorInvestido' },
        totalAtual: { $sum: '$valorAtual' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (result.length === 0) {
    return {
      totalInvestido: 0,
      totalAtual: 0,
      ganhoPerda: 0,
      percentualGanhoPerda: 0,
      count: 0
    };
  }
  
  const summary = result[0];
  summary.ganhoPerda = summary.totalAtual - summary.totalInvestido;
  summary.percentualGanhoPerda = summary.totalInvestido > 0 
    ? (summary.ganhoPerda / summary.totalInvestido) * 100 
    : 0;
  
  return summary;
};

// Método estático para buscar investimentos por tipo
investmentSchema.statics.getByTypeStats = async function(userId) {
  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        ativo: true
      }
    },
    {
      $group: {
        _id: '$tipo',
        totalInvestido: { $sum: '$valorInvestido' },
        totalAtual: { $sum: '$valorAtual' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        tipo: '$_id',
        totalInvestido: 1,
        totalAtual: 1,
        ganhoPerda: { $subtract: ['$totalAtual', '$totalInvestido'] },
        percentualGanhoPerda: {
          $cond: [
            { $eq: ['$totalInvestido', 0] },
            0,
            { $multiply: [{ $divide: [{ $subtract: ['$totalAtual', '$totalInvestido'] }, '$totalInvestido'] }, 100] }
          ]
        },
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { totalAtual: -1 }
    }
  ]);
};

module.exports = mongoose.model('Investment', investmentSchema);

