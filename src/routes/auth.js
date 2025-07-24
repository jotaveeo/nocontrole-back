const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { authValidation } = require('../middlewares/validation');
const { authLimiter } = require('../middlewares/security');

const router = express.Router();

// Rotas públicas (sem autenticação)
router.post('/register', authLimiter, authValidation.register, authController.register);
router.post('/login', authLimiter, authValidation.login, authController.login);
router.post('/refresh', authController.refresh);
router.post('/request-password-reset', authValidation.requestPasswordReset, authController.requestPasswordReset);

// Rotas protegidas (com autenticação)
router.use(authenticate);

router.get('/me', authController.me);
router.get('/verify', authController.verifyToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.post('/change-password', authValidation.changePassword, authController.changePassword);

module.exports = router;

