const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/auth');
const { categoryValidation, idValidation, queryValidation } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de categorias
router.get('/', queryValidation.pagination, categoryController.getCategories);
router.get('/paginated', queryValidation.pagination, categoryController.getCategoriesWithPagination);
router.get('/stats', categoryController.getCategoryStats);
router.get('/most-used', categoryController.getMostUsedCategories);
router.post('/default', categoryController.createDefaultCategories);
router.post('/', categoryValidation.create, categoryController.createCategory);
router.get('/:id', idValidation.mongoId, categoryController.getCategoryById);
router.put('/:id', categoryValidation.update, categoryController.updateCategory);
router.delete('/all', (req, res, next) => {
  console.log('>>> Chegou na rota DELETE /api/categories/all');
  next();
}, categoryController.deleteAllCategories);
router.delete('/:id', idValidation.mongoId, categoryController.deleteCategory);

module.exports = router;

