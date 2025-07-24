const axios = require('axios');

const MP_BASE_URL = 'https://api.mercadopago.com';
const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

// Cria um plano de assinatura
async function createPlan(planData) {
  const response = await axios.post(
    `${MP_BASE_URL}/preapproval_plan`,
    planData,
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Cria uma assinatura vinculada ao plano
async function createSubscription(subscriptionData) {
  const response = await axios.post(
    `${MP_BASE_URL}/preapproval`,
    subscriptionData,
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

module.exports = { createPlan, createSubscription };
