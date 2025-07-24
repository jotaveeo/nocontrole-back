const express = require('express');
const cardController = require('../controllers/cardController');
const { authenticate } = require('../middlewares/auth');
const { idValidation, queryValidation } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de cartões
router.get('/', queryValidation.pagination, cardController.getCards);
router.get('/active', cardController.getActiveCards);
router.get('/paginated', queryValidation.pagination, cardController.getCardsWithPagination);
router.get('/stats', cardController.getCardStats);
router.get('/near-due-date', cardController.getNearDueDateCards);
router.get('/low-limit', cardController.getLowLimitCards);
router.get('/summary-by-brand', cardController.getSummaryByBrand);
router.post('/', cardController.createCard);
router.get('/:id', idValidation.mongoId, cardController.getCardById);
router.put('/:id', idValidation.mongoId, cardController.updateCard);
router.delete('/:id', idValidation.mongoId, cardController.deleteCard);
router.patch('/:id/balance', idValidation.mongoId, cardController.updateBalance);
router.get('/:id/monthly-expenses', idValidation.mongoId, cardController.getMonthlyExpenses);
router.get('/brand/:bandeira', cardController.getCardsByBrand);

module.exports = router;

