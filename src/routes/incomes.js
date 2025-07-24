const express = require('express');
const incomeController = require('../controllers/incomeController');
const { authenticate } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');

const router = express.Router();
router.use(authenticate);

router.get('/', incomeController.getIncomes);
router.post('/', incomeController.createIncome);
router.put('/:id', idValidation.mongoId, incomeController.updateIncome);
router.delete('/:id', idValidation.mongoId, incomeController.deleteIncome);

module.exports = router;
