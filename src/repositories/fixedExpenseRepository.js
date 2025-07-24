const { FixedExpense } = require('../models');
const { isValidObjectId } = require('mongoose');

class FixedExpenseRepository {
  async findByUser(userId, filters = {}) {
    return FixedExpense.find({ user: userId, ...filters }).sort({ diaVencimento: 1 }).lean();
  }

  async findById(id, userId) {
    if (!isValidObjectId(id)) return null;
    return FixedExpense.findOne({ _id: id, user: userId }).lean();
  }

  async create(data) {
    return FixedExpense.create(data);
  }

  async update(id, data, userId) {
    if (!isValidObjectId(id)) return null;
    return FixedExpense.findOneAndUpdate({ _id: id, user: userId }, data, { new: true, runValidators: true }).lean();
  }

  async delete(id, userId) {
    if (!isValidObjectId(id)) return null;
    return FixedExpense.findOneAndDelete({ _id: id, user: userId });
  }
}

module.exports = new FixedExpenseRepository();
