const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  name: {
    type: String,
    required: [true, 'Nome da conta é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  type: {
    type: String,
    required: [true, 'Tipo da conta é obrigatório'],
    enum: {
      values: ['checking', 'savings', 'credit', 'investment', 'cash'],
      message: 'Tipo de conta inválido'
    }
  },
  bank: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome do banco não pode ter mais de 100 caracteres']
  },
  balance: {
    type: Number,
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  initialBalance: {
    type: Number,
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  currency: {
    type: String,
    default: 'BRL',
    uppercase: true,
    maxlength: [3, 'Código da moeda deve ter 3 caracteres']
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor deve estar no formato hexadecimal']
  },
  icon: {
    type: String,
    default: 'wallet'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  creditLimit: {
    type: Number,
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  dueDate: {
    type: Number,
    min: 1,
    max: 31
  },
  closingDate: {
    type: Number,
    min: 1,
    max: 31
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true
  },
  toObject: { 
    virtuals: true,
    getters: true
  }
});

// Índices
accountSchema.index({ user: 1, isActive: 1 });
accountSchema.index({ user: 1, type: 1 });

// Virtual para transações da conta
accountSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'account'
});

// Virtual para saldo disponível (para contas de crédito)
accountSchema.virtual('availableBalance').get(function() {
  if (this.type === 'credit') {
    return this.creditLimit + this.balance;
  }
  return this.balance;
});

// Middleware para validação de campos específicos por tipo
accountSchema.pre('save', function(next) {
  if (this.type === 'credit') {
    if (!this.dueDate || !this.closingDate) {
      return next(new Error('Contas de crédito devem ter data de vencimento e fechamento'));
    }
  }
  next();
});

// Método para atualizar saldo
accountSchema.methods.updateBalance = function(amount, operation = 'add') {
  if (operation === 'add') {
    this.balance += amount;
  } else if (operation === 'subtract') {
    this.balance -= amount;
  } else {
    this.balance = amount;
  }
  
  // Arredondar para 2 casas decimais
  this.balance = Math.round(this.balance * 100) / 100;
  
  return this.save();
};

// Método estático para buscar contas ativas do usuário
accountSchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, isActive: true }).sort({ name: 1 });
};

module.exports = mongoose.model('Account', accountSchema);

