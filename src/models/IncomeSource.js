const mongoose = require('mongoose');

const incomeSourceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  nome: {
    type: String,
    required: [true, 'Nome da fonte de renda é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  tipo: {
    type: String,
    required: [true, 'Tipo da fonte de renda é obrigatório'],
    enum: {
      values: ['salario', 'freelance', 'investimentos', 'aluguel', 'pensao', 'aposentadoria', 'outros'],
      message: 'Tipo de fonte de renda inválido'
    }
  },
  valorMensal: {
    type: Number,
    required: [true, 'Valor mensal é obrigatório'],
    min: [0, 'Valor mensal deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  diaRecebimento: {
    type: Number,
    required: [true, 'Dia de recebimento é obrigatório'],
    min: [1, 'Dia de recebimento deve ser entre 1 e 31'],
    max: [31, 'Dia de recebimento deve ser entre 1 e 31']
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
  empresa: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome da empresa não pode ter mais de 100 caracteres']
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
  },
  ultimoRecebimento: {
    type: Date,
    default: null
  },
  proximoRecebimento: {
    type: Date,
    default: null
  },
  variavel: {
    type: Boolean,
    default: false
  },
  valorMinimo: {
    type: Number,
    default: 0,
    min: [0, 'Valor mínimo deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  valorMaximo: {
    type: Number,
    default: 0,
    min: [0, 'Valor máximo deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
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
incomeSourceSchema.index({ user: 1, ativo: 1 });
incomeSourceSchema.index({ user: 1, tipo: 1 });
incomeSourceSchema.index({ user: 1, diaRecebimento: 1 });

// Virtual para próximo recebimento
incomeSourceSchema.virtual('proximoRecebimentoCalculado').get(function() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  
  let proximoRecebimento = new Date(ano, mes, this.diaRecebimento);
  
  // Se já passou do dia de recebimento neste mês, usar o próximo mês
  if (proximoRecebimento <= hoje) {
    proximoRecebimento = new Date(ano, mes + 1, this.diaRecebimento);
  }
  
  return proximoRecebimento;
});

// Virtual para dias até recebimento
incomeSourceSchema.virtual('diasRecebimento').get(function() {
  const hoje = new Date();
  const recebimento = this.proximoRecebimentoCalculado;
  const diffTime = recebimento - hoje;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual para valor anual estimado
incomeSourceSchema.virtual('valorAnual').get(function() {
  return this.valorMensal * 12;
});

// Middleware para sincronizar campos categoria/categoriaId
incomeSourceSchema.pre('save', function(next) {
  if (this.categoria && !this.categoriaId) {
    this.categoriaId = this.categoria;
  } else if (this.categoriaId && !this.categoria) {
    this.categoria = this.categoriaId;
  }
  
  // Calcular próximo recebimento
  this.proximoRecebimento = this.proximoRecebimentoCalculado;
  
  // Validar valores mínimo e máximo para renda variável
  if (this.variavel) {
    if (this.valorMinimo > this.valorMaximo && this.valorMaximo > 0) {
      const temp = this.valorMinimo;
      this.valorMinimo = this.valorMaximo;
      this.valorMaximo = temp;
    }
  }
  
  next();
});

// Método estático para buscar fontes ativas do usuário
incomeSourceSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ diaRecebimento: 1 });
};

// Método estático para buscar por tipo
incomeSourceSchema.statics.findByType = function(userId, tipo) {
  return this.find({ user: userId, tipo, ativo: true })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ diaRecebimento: 1 });
};

// Método para registrar recebimento
incomeSourceSchema.methods.registrarRecebimento = function(valor = null, data = new Date()) {
  this.ultimoRecebimento = data;
  
  // Se valor foi fornecido e é renda variável, atualizar valor mensal
  if (valor !== null && this.variavel) {
    this.valorMensal = valor;
  }
  
  return this.save();
};

// Método estático para calcular renda total mensal
incomeSourceSchema.statics.getMonthlyTotal = async function(userId) {
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
        totalMensal: { $sum: '$valorMensal' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { totalMensal: 0, count: 0 };
};

// Método estático para buscar recebimentos próximos
incomeSourceSchema.statics.findUpcoming = function(userId, days = 7) {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(hoje.getDate() + days);
  
  return this.find({
    user: userId,
    ativo: true,
    proximoRecebimento: { $lte: limite }
  })
    .populate('categoria', 'nome cor icone')
    .populate('categoriaId', 'nome cor icone')
    .sort({ proximoRecebimento: 1 });
};

// Método estático para estatísticas por tipo
incomeSourceSchema.statics.getStatsByType = async function(userId) {
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
        totalMensal: { $sum: '$valorMensal' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        tipo: '$_id',
        totalMensal: 1,
        totalAnual: { $multiply: ['$totalMensal', 12] },
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { totalMensal: -1 }
    }
  ]);
};

// Método estático para histórico de recebimentos
incomeSourceSchema.statics.getReceivingHistory = async function(userId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  
  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        ultimoRecebimento: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$ultimoRecebimento' },
          tipo: '$tipo'
        },
        total: { $sum: '$valorMensal' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.month',
        tipos: {
          $push: {
            tipo: '$_id.tipo',
            total: '$total',
            count: '$count'
          }
        },
        totalMes: { $sum: '$total' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('IncomeSource', incomeSourceSchema);

