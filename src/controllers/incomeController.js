const incomeRepository = require('../repositories/incomeRepository');
const { asyncHandler } = require('../middlewares/errorHandler');

class IncomeController {
  getIncomes = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const incomes = await incomeRepository.findByUser(userId);
    res.json({ success: true, data: incomes });
  });

  createIncome = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // Compatibilidade com campos alternativos do frontend
    const body = req.body;
    const tipoMap = {
      'Salário': 'salario',
      'salário': 'salario',
      'Salario': 'salario',
      'Freelance': 'freelance',
      'Investimentos': 'investimentos',
      'Aluguel': 'aluguel',
      'Pensão': 'pensao',
      'Pensao': 'pensao',
      'Aposentadoria': 'aposentadoria',
      'Outros': 'outros'
    };
    const data = {
      nome: body.nome || body.fonte || body.descricao,
      tipo: tipoMap[body.tipo] || (body.tipo ? body.tipo.toLowerCase() : undefined),
      valorMensal: body.valorMensal || body.valor,
      diaRecebimento: body.diaRecebimento || body.dia || (body.data ? new Date(body.data).getDate() : undefined),
      recorrente: body.recorrente,
      observacoes: body.observacoes,
      user: userId
    };
    const income = await incomeRepository.create(data);
    res.status(201).json({ success: true, data: income });
  });

  updateIncome = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    // Compatibilidade com campos alternativos do frontend
    const body = req.body;
    const tipoMap = {
      'Salário': 'salario',
      'salário': 'salario',
      'Salario': 'salario',
      'Freelance': 'freelance',
      'Investimentos': 'investimentos',
      'Aluguel': 'aluguel',
      'Pensão': 'pensao',
      'Pensao': 'pensao',
      'Aposentadoria': 'aposentadoria',
      'Outros': 'outros'
    };
    const data = {
      nome: body.nome || body.fonte || body.descricao,
      tipo: tipoMap[body.tipo] || (body.tipo ? body.tipo.toLowerCase() : undefined),
      valorMensal: body.valorMensal || body.valor,
      diaRecebimento: body.diaRecebimento || body.dia || (body.data ? new Date(body.data).getDate() : undefined),
      recorrente: body.recorrente,
      observacoes: body.observacoes
    };
    const income = await incomeRepository.update(id, data, userId);
    res.json({ success: true, data: income });
  });

  deleteIncome = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    await incomeRepository.delete(id, userId);
    res.json({ success: true });
  });
}

module.exports = new IncomeController();
