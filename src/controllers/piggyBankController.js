const { piggyBankRepository } = require('../repositories');
const { asyncHandler } = require('../middlewares/errorHandler');

class PiggyBankController {
    getEntries = asyncHandler(async (req, res) => {
        const userId = req.user._id;
        const entries = await piggyBankRepository.findByUser(userId);
        res.json({ success: true, data: entries });
    });

    createEntry = asyncHandler(async (req, res) => {
        const userId = req.user._id;
        const data = { ...req.body, user: userId };
        const entry = await piggyBankRepository.create(data);
        res.status(201).json({ success: true, data: entry });
    });

    updateEntry = asyncHandler(async (req, res) => {
        const userId = req.user._id;
        const { id } = req.params;
        const entry = await piggyBankRepository.update(id, req.body, userId);
        res.json({ success: true, data: entry });
    });

    deleteEntry = asyncHandler(async (req, res) => {
        const userId = req.user._id;
        const { id } = req.params;
        await piggyBankRepository.delete(id, userId);
        res.json({ success: true });
    });
}

module.exports = new PiggyBankController();