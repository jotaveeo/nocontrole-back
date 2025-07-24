const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/auth');
const { queryValidation } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de relatórios
router.get('/available', reportController.getAvailableReports);
router.get('/financial', reportController.generateFinancialReport);
router.get('/categories', reportController.generateCategoryReport);
router.get('/cash-flow', reportController.generateCashFlowReport);
router.get('/top-categories', queryValidation.dateRange, reportController.getTopCategories);
router.get('/monthly-evolution', queryValidation.dateRange, reportController.getMonthlyEvolution);
router.get('/export', reportController.exportReport);

module.exports = router;

