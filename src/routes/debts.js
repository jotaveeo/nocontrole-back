const express = require('express');
const debtController = require('../controllers/debtController');
const { authenticate } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', debtController.getDebts);
router.post('/', debtController.createDebt);
router.put('/:id', idValidation.mongoId, debtController.updateDebt);
router.delete('/:id', idValidation.mongoId, debtController.deleteDebt);

module.exports = router;
