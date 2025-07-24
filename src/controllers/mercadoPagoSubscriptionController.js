const { createPlan, createSubscription } = require('../services/mercadoPagoSubscription');
const { asyncHandler } = require('../middlewares/errorHandler');

class MercadoPagoSubscriptionController {
  // Cria plano de assinatura
  createPlan = asyncHandler(async (req, res) => {
    const planData = req.body;
    const plan = await createPlan(planData);
    res.status(201).json({ success: true, data: plan });
  });

  // Cria assinatura vinculada ao plano
  createSubscription = asyncHandler(async (req, res) => {
    const subscriptionData = req.body;
    const subscription = await createSubscription(subscriptionData);
    res.status(201).json({ success: true, data: subscription });
  });
}

module.exports = new MercadoPagoSubscriptionController();
