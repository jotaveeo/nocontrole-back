const mongoose = require('mongoose');

const piggyBankSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  descricao: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  data: {
    type: Date,
    required: true
  },
  mes: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  ano: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true }
});

module.exports = mongoose.model('PiggyBank', piggyBankSchema);