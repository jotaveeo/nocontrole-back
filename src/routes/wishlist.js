const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middlewares/auth');
const { idValidation, queryValidation } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de wishlist
router.get('/', queryValidation.pagination, wishlistController.getWishlistItems);
router.get('/active', wishlistController.getActiveWishlistItems);
router.get('/paginated', queryValidation.pagination, wishlistController.getWishlistItemsWithPagination);
router.get('/stats', wishlistController.getWishlistStats);
router.get('/near-goal', wishlistController.getNearGoalItems);
router.get('/overdue', wishlistController.getOverdueItems);
router.get('/summary-by-priority', wishlistController.getSummaryByPriority);
router.post('/', wishlistController.createWishlistItem);
router.get('/status/:status', wishlistController.getWishlistItemsByStatus);
router.get('/priority/:prioridade', wishlistController.getWishlistItemsByPriority);
router.get('/:id', idValidation.mongoId, wishlistController.getWishlistItemById);
router.put('/:id', idValidation.mongoId, wishlistController.updateWishlistItem);
router.delete('/:id', idValidation.mongoId, wishlistController.deleteWishlistItem);
router.patch('/:id/add-savings', idValidation.mongoId, wishlistController.addSavings);
router.patch('/:id/mark-purchased', idValidation.mongoId, wishlistController.markAsPurchased);
router.get('/category/:categoriaId', idValidation.mongoId, wishlistController.getWishlistItemsByCategory);

module.exports = router;

