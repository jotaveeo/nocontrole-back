const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middlewares/auth');
const { transactionValidation, idValidation, queryValidation } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de transações
router.get('/', queryValidation.pagination, queryValidation.dateRange, transactionController.getTransactions);
router.get('/summary', queryValidation.dateRange, transactionController.getFinancialSummary);
router.get('/by-category', queryValidation.dateRange, transactionController.getTransactionsByCategory);
router.get('/cash-flow', transactionController.getMonthlyCashFlow);
router.get('/stats', transactionController.getTransactionStats);
router.get('/recent', transactionController.getRecentTransactions);
router.post('/', transactionValidation.create, transactionController.createTransaction);
router.post('/bulk', transactionValidation.bulkCreate, transactionController.createBulkTransactions);
router.get('/:id', idValidation.mongoId, transactionController.getTransactionById);
router.put('/:id', transactionValidation.update, transactionController.updateTransaction);
router.delete('/:id', idValidation.mongoId, transactionController.deleteTransaction);

module.exports = router;

