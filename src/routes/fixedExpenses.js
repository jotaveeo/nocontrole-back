const express = require('express');
const fixedExpenseController = require('../controllers/fixedExpenseController');
const { authenticate } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');

const router = express.Router();
router.use(authenticate);

router.get('/', fixedExpenseController.getFixedExpenses);
router.post('/', fixedExpenseController.createFixedExpense);
router.put('/:id', idValidation.mongoId, fixedExpenseController.updateFixedExpense);
router.delete('/:id', idValidation.mongoId, fixedExpenseController.deleteFixedExpense);

module.exports = router;
