const express = require('express');
const investmentController = require('../controllers/investmentController');
const { authenticate } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');

const router = express.Router();
router.use(authenticate);

router.get('/', investmentController.getInvestments);
router.post('/', investmentController.createInvestment);
router.put('/:id', idValidation.mongoId, investmentController.updateInvestment);
router.delete('/:id', idValidation.mongoId, investmentController.deleteInvestment);

module.exports = router;
