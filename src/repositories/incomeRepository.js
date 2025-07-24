const { IncomeSource } = require('../models');
const { isValidObjectId } = require('mongoose');

class IncomeRepository {
  async findByUser(userId, filters = {}) {
    return IncomeSource.find({ user: userId, ...filters }).sort({ diaRecebimento: 1 }).lean();
  }

  async findById(id, userId) {
    if (!isValidObjectId(id)) return null;
    return IncomeSource.findOne({ _id: id, user: userId }).lean();
  }

  async create(data) {
    return IncomeSource.create(data);
  }

  async update(id, data, userId) {
    if (!isValidObjectId(id)) return null;
    return IncomeSource.findOneAndUpdate({ _id: id, user: userId }, data, { new: true, runValidators: true }).lean();
  }

  async delete(id, userId) {
    if (!isValidObjectId(id)) return null;
    return IncomeSource.findOneAndDelete({ _id: id, user: userId });
  }
}

module.exports = new IncomeRepository();
