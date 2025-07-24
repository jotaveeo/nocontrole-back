const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');
const { queryValidation } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas do dashboard
router.get('/', dashboardController.getDashboardData);
router.get('/statistics', dashboardController.getStatistics);
router.get('/alerts', dashboardController.getAlerts);
router.get('/monthly-resume', dashboardController.getMonthlyResume);
router.get('/trends', dashboardController.getFinancialTrends);
router.get('/comparison', queryValidation.dateRange, dashboardController.getComparison);
router.get('/card-expenses-summary', dashboardController.getCardExpensesSummary);

module.exports = router;

