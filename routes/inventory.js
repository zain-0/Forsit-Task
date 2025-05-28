const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAllInventory);
router.get('/product/:productId', inventoryController.getInventoryByProduct);

// NOTE: should be moved to /status endpoint
router.get('/:id/status', inventoryController.getInventoryStatus);

router.put('/:id/stock', inventoryController.updateInventoryStock);
router.put('/:id/levels', inventoryController.updateInventoryLevels);
router.post('/bulk-update', inventoryController.bulkUpdateInventory);
router.get('/:id/transactions', inventoryController.getInventoryTransactions);
router.get('/history/:productId', inventoryController.getInventoryHistory);
router.get('/alerts/low-stock', inventoryController.getLowStockItems);

module.exports = router;
