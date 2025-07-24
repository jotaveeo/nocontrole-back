const express = require('express');
const piggyBankController = require('../controllers/piggyBankController');
const { authenticate } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas do cofrinho
router.get('/', piggyBankController.getEntries);
router.post('/', piggyBankController.createEntry);
router.get('/:id', idValidation.mongoId, piggyBankController.getEntries); // opcional: get por id
router.put('/:id', idValidation.mongoId, piggyBankController.updateEntry);
router.delete('/:id', idValidation.mongoId, piggyBankController.deleteEntry);

module.exports = router;
