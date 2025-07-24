const express = require('express');
const goalController = require('../controllers/goalController');
const { authenticate } = require('../middlewares/auth');
const { idValidation, queryValidation } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de metas
router.get('/', queryValidation.pagination, goalController.getGoals);
router.get('/active', goalController.getActiveGoals);
router.get('/paginated', queryValidation.pagination, goalController.getGoalsWithPagination);
router.get('/stats', goalController.getGoalStats);
router.get('/near-deadline', goalController.getNearDeadlineGoals);
router.post('/', goalController.createGoal);
router.get('/:id', idValidation.mongoId, goalController.getGoalById);
router.put('/:id', idValidation.mongoId, goalController.updateGoal);
router.delete('/:id', idValidation.mongoId, goalController.deleteGoal);
router.patch('/:id/progress', idValidation.mongoId, goalController.updateProgress);
router.patch('/:id/set-progress', idValidation.mongoId, goalController.setProgress);
router.get('/category/:categoriaId', idValidation.mongoId, goalController.getGoalsByCategory);

module.exports = router;

