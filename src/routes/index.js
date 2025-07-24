const mercadoPagoSubscriptionsRoutes = require('./mercadoPagoSubscriptions');
router.use('/mercado-pago', mercadoPagoSubscriptionsRoutes);
const express = require('express');
const authRoutes = require('./auth');
const categoryRoutes = require('./categories');
const piggyBankRoutes = require('./piggybank');
const fixedExpensesRoutes = require('./fixedExpenses');
const debtRoutes = require('./debts');
const transactionRoutes = require('./transactions');
const goalRoutes = require('./goals');
const cardRoutes = require('./cards');
const wishlistRoutes = require('./wishlist');
const investmentsRoutes = require('./investments');
const dashboardRoutes = require('./dashboard');
const reportRoutes = require('./reports');
const incomesRoutes = require('./incomes');
const categoryLimitsRoutes = require('./categoryLimits');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API NoControle funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
    piggybank: '/api/piggybank',
    debts: '/api/debts',
      transactions: '/api/transactions',
      goals: '/api/goals',
      cards: '/api/cards',
      wishlist: '/api/wishlist',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      fixedExpenses: '/api/fixed-expenses',
      investments: '/api/investments',
      incomes: '/api/incomes'
    }
  });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/piggybank', piggyBankRoutes);
router.use('/fixed-expenses', fixedExpensesRoutes);
router.use('/debts', debtRoutes);
router.use('/transactions', transactionRoutes);
router.use('/goals', goalRoutes);
router.use('/cards', cardRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/investments', investmentsRoutes);
router.use('/incomes', incomesRoutes);

// Limites de categoria
router.use('/category-limits', categoryLimitsRoutes);

module.exports = router;

