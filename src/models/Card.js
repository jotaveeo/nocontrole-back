const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  nome: {
    type: String,
    required: [true, 'Nome do cartão é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  // bandeira removida para compatibilidade com o frontend
  limite: {
    type: Number,
    required: [true, 'Limite é obrigatório'],
    min: [0, 'Limite deve ser positivo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  saldoAtual: {
    type: Number,
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  diaVencimento: {
    type: Number,
    required: [true, 'Dia de vencimento é obrigatório'],
    min: [1, 'Dia de vencimento deve ser entre 1 e 31'],
    max: [31, 'Dia de vencimento deve ser entre 1 e 31']
  },
  // diaFechamento removido para compatibilidade com o frontend
  ativo: {
    type: Boolean,
    default: true
  },
  principal: {
    type: Boolean,
    required: true,
    default: false
  },
  cor: {
    type: String,
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor deve estar no formato hexadecimal']
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      ret.currentBalance = ret.saldoAtual; // Alias para compatibilidade
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
cardSchema.index({ user: 1, ativo: 1 });
cardSchema.index({ user: 1, nome: 1 }, { unique: true });

// Virtual para limite disponível
cardSchema.virtual('limiteDisponivel').get(function() {
  return Math.max(0, this.limite - this.saldoAtual);
});

// Virtual para percentual usado
cardSchema.virtual('percentualUsado').get(function() {
  if (this.limite === 0) return 0;
  return Math.min((this.saldoAtual / this.limite) * 100, 100);
});

// Virtual para próximo vencimento
cardSchema.virtual('proximoVencimento').get(function() {
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

// Virtual para próximo fechamento removido (diaFechamento não existe mais)

// Virtual para transações do cartão
cardSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'cartaoId'
});

// Método estático para buscar cartões ativos do usuário
cardSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, ativo: true }).sort({ nome: 1 });
};

// Método para atualizar saldo
cardSchema.methods.atualizarSaldo = function(valor, operacao = 'add') {
  if (operacao === 'add') {
    this.saldoAtual += valor;
  } else if (operacao === 'subtract') {
    this.saldoAtual -= valor;
  } else {
    this.saldoAtual = valor;
  }
  
  // Garantir que o saldo não seja negativo
  this.saldoAtual = Math.max(0, this.saldoAtual);
  
  // Arredondar para 2 casas decimais
  this.saldoAtual = Math.round(this.saldoAtual * 100) / 100;
  
  return this.save();
};

// Método para calcular gastos do mês
cardSchema.methods.getGastosMes = async function(ano, mes) {
  const Transaction = mongoose.model('Transaction');
  
  const startDate = new Date(ano, mes - 1, 1);
  const endDate = new Date(ano, mes, 0, 23, 59, 59);
  
  const result = await Transaction.aggregate([
    {
      $match: {
        cartaoId: this._id,
        data: { $gte: startDate, $lte: endDate },
        tipo: 'despesa',
        status: 'confirmada'
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

module.exports = mongoose.model('Card', cardSchema);

