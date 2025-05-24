const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const ResponseUtils = require('../utils/responseUtils');

// Get revenue summary
router.get('/revenue/summary', async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    let startDate = new Date();
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const results = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' }
        }
      }
    ]);

    const data = results[0] || {
      totalRevenue: 0,
      totalSales: 0,
      averageOrderValue: 0
    };

    return ResponseUtils.success(res, data);
  } catch (error) {
    return next(error);
  }
});

// Get top selling products
router.get('/products/top-selling', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProducts = await Sale.aggregate([
      { $match: { saleDate: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$finalAmount' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    return ResponseUtils.success(res, topProducts);
  } catch (error) {
    return next(error);
  }
});

// Get sales trends
router.get('/revenue/trends', async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trends = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
            day: { $dayOfMonth: '$saleDate' }
          },
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return ResponseUtils.success(res, trends);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;