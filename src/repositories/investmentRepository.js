const { Investment } = require('../models');
const { isValidObjectId } = require('mongoose');

class InvestmentRepository {
  async findByUser(userId, filters = {}) {
    return Investment.find({ user: userId, ...filters }).sort({ dataInvestimento: -1 }).lean();
  }

  async findById(id, userId) {
    if (!isValidObjectId(id)) return null;
    return Investment.findOne({ _id: id, user: userId }).lean();
  }

  async create(data) {
    return Investment.create(data);
  }

  async update(id, data, userId) {
    if (!isValidObjectId(id)) return null;
    return Investment.findOneAndUpdate({ _id: id, user: userId }, data, { new: true, runValidators: true }).lean();
  }

  async delete(id, userId) {
    if (!isValidObjectId(id)) return null;
    return Investment.findOneAndDelete({ _id: id, user: userId });
  }
}

module.exports = new InvestmentRepository();
