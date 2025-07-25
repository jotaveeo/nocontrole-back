const express = require('express');
const controller = require('../controllers/mercadoPagoSubscriptionController');

const router = express.Router();
// router.use(authenticate);

// Criar plano de assinatura
router.post('/plan', controller.createPlan);
// Criar assinatura vinculada ao plano
router.post('/subscription', controller.createSubscription);

module.exports = router;
