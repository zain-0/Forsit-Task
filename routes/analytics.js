const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Revenue analytics by period
router.get('/revenue/daily', analyticsController.getDailyRevenue);
router.get('/revenue/weekly', analyticsController.getWeeklyRevenue);
router.get('/revenue/monthly', analyticsController.getMonthlyRevenue);
router.get('/revenue/annual', analyticsController.getAnnualRevenue);
router.get('/revenue/comparison', analyticsController.getRevenueComparison);

router.get('/revenue/summary', analyticsController.getRevenueSummary);
router.get('/products/top-selling', analyticsController.getTopSellingProducts);
router.get('/revenue/trends', analyticsController.getSalesTrends);

module.exports = router;