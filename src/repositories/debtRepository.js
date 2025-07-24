const { Debt } = require('../models');
const { isValidObjectId } = require('mongoose');

class DebtRepository {
  async findByUser(userId, { page = 1, limit = 50 } = {}) {
    return Debt.find({ user: userId })
      .sort({ dataVencimento: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  async findById(id, userId) {
    if (!isValidObjectId(id)) return null;
    return Debt.findOne({ _id: id, user: userId }).lean();
  }

  async create(data) {
    // Garante que valorPago nunca seja maior que valorTotal
    if (data.valorPago && data.valorTotal && data.valorPago > data.valorTotal) {
      data.valorPago = data.valorTotal;
    }
    return Debt.create(data);
  }

  async update(id, data, userId) {
    if (!isValidObjectId(id)) return null;
    // Garante que valorPago nunca seja maior que valorTotal
    if (data.valorPago && data.valorTotal && data.valorPago > data.valorTotal) {
      data.valorPago = data.valorTotal;
    }
    return Debt.findOneAndUpdate(
      { _id: id, user: userId },
      data,
      { new: true, runValidators: true }
    ).lean();
  }

  async delete(id, userId) {
    if (!isValidObjectId(id)) return null;
    return Debt.findOneAndDelete({ _id: id, user: userId });
  }
}

module.exports = new DebtRepository();
