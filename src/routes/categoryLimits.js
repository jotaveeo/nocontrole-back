const express = require('express');
const categoryLimitController = require('../controllers/categoryLimitController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', categoryLimitController.getCategoryLimits);
router.post('/', categoryLimitController.upsertCategoryLimit);
router.delete('/:categoryName', categoryLimitController.deleteCategoryLimit);

module.exports = router;
