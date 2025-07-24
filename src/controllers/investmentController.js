const investmentRepository = require('../repositories/investmentRepository');
const { asyncHandler } = require('../middlewares/errorHandler');

class InvestmentController {
  getInvestments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const investments = await investmentRepository.findByUser(userId);
    res.json({ success: true, data: investments });
  });

  createInvestment = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const data = { ...req.body, user: userId };
    const investment = await investmentRepository.create(data);
    res.status(201).json({ success: true, data: investment });
  });

  updateInvestment = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const investment = await investmentRepository.update(id, req.body, userId);
    res.json({ success: true, data: investment });
  });

  deleteInvestment = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    await investmentRepository.delete(id, userId);
    res.json({ success: true });
  });
}

module.exports = new InvestmentController();
