const { PiggyBank } = require('../models');
const mongoose = require('mongoose');

class PiggyBankRepository {
  async findByUser(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('ID de usuário inválido');
    return PiggyBank.find({ user: userId }).sort({ data: -1 });
  }

  async findById(id, userId) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID inválido');
    return PiggyBank.findOne({ _id: id, user: userId });
  }

  async create(data) {
    if (!data.user || !mongoose.Types.ObjectId.isValid(data.user)) throw new Error('ID de usuário inválido');
    if (!data.descricao || typeof data.descricao !== 'string') throw new Error('Descrição obrigatória');
    if (!data.valor || typeof data.valor !== 'number' || data.valor <= 0) throw new Error('Valor inválido');
    if (!data.data || isNaN(new Date(data.data).getTime())) throw new Error('Data inválida');
    if (!data.mes || data.mes < 1 || data.mes > 12) throw new Error('Mês inválido');
    if (!data.ano || typeof data.ano !== 'number') throw new Error('Ano inválido');
    return PiggyBank.create(data);
  }

  async update(id, data, userId) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID inválido');
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('ID de usuário inválido');
    return PiggyBank.findOneAndUpdate({ _id: id, user: userId }, data, { new: true });
  }

  async delete(id, userId) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID inválido');
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('ID de usuário inválido');
    return PiggyBank.findOneAndDelete({ _id: id, user: userId });
  }

  async findAll() {
    return PiggyBank.find({}).sort({ data: -1 });
  }

  async getStatsByUser(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('ID de usuário inválido');
    const total = await PiggyBank.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    return total[0]?.total || 0;
  }
}

module.exports = new PiggyBankRepository();
