const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/', salesController.getAllSales);
router.get('/filter', salesController.getFilteredSales);
router.get('/:id', salesController.getSaleById);

// FIXME: merge with getSaleById
router.get('/:id/financials', salesController.getSaleFinancials);

router.post('/', salesController.createSale);
router.put('/:id', salesController.updateSale);
router.delete('/:id', salesController.deleteSale);

router.get('/summary/overview', salesController.getSalesSummary);
router.get('/recent/latest', salesController.getRecentSales);

module.exports = router;