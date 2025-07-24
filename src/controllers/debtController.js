const { debtRepository } = require('../repositories');
const { asyncHandler } = require('../middlewares/errorHandler');

class DebtController {
  getDebts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const debts = await debtRepository.findByUser(userId, { page, limit });
    res.json({ success: true, data: debts });
  });

  createDebt = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const data = { ...req.body, user: userId };
    const debt = await debtRepository.create(data);
    res.status(201).json({ success: true, data: debt });
  });

  updateDebt = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const debt = await debtRepository.update(id, req.body, userId);
    res.json({ success: true, data: debt });
  });

  deleteDebt = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    await debtRepository.delete(id, userId);
    res.json({ success: true });
  });
}

module.exports = new DebtController();
