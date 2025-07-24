const fixedExpenseRepository = require('../repositories/fixedExpenseRepository');
const { asyncHandler } = require('../middlewares/errorHandler');

class FixedExpenseController {
  getFixedExpenses = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const expenses = await fixedExpenseRepository.findByUser(userId);
    res.json({ success: true, data: expenses });
  });

  createFixedExpense = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const data = { ...req.body, user: userId };
    const expense = await fixedExpenseRepository.create(data);
    res.status(201).json({ success: true, data: expense });
  });

  updateFixedExpense = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const expense = await fixedExpenseRepository.update(id, req.body, userId);
    res.json({ success: true, data: expense });
  });

  deleteFixedExpense = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    await fixedExpenseRepository.delete(id, userId);
    res.json({ success: true });
  });
}

module.exports = new FixedExpenseController();
