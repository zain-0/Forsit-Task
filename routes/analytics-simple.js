const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const ResponseUtils = require('../utils/responseUtils');
const { ValidationError } = require('../utils/errors');

// Get revenue summary
router.get('/revenue/summary', async (req, res, next) => {
  try {
    const { period = 'monthly', marketplace } = req.query;

    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
      throw new ValidationError('Invalid period. Use: daily, weekly, monthly, yearly');
    }

    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
    }

    const query = { 
      saleDate: { $gte: startDate, $lt: endDate }
    };
    if (marketplace) query.marketplace = marketplace;

    const results = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const data = results[0] || {
      totalRevenue: 0,
      totalSales: 0,
      averageOrderValue: 0,
      totalQuantity: 0
    };

    return ResponseUtils.success(res, {
      period,
      dateRange: { startDate, endDate },
      ...data
    });
  } catch (error) {
    return next(error);
  }
});

// Get top selling products
router.get('/products/top-selling', async (req, res, next) => {
  try {
    const { period = 'monthly', limit = 10, marketplace } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const query = { saleDate: { $gte: startDate } };
    if (marketplace) query.marketplace = marketplace;

    const topProducts = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$finalAmount' },
          salesCount: { $sum: 1 }
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
          productId: '$_id',
          name: '$product.name',
          sku: '$product.sku',
          brand: '$product.brand',
          totalQuantity: 1,
          totalRevenue: 1,
          salesCount: 1
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

// Get sales by category
router.get('/categories/performance', async (req, res, next) => {
  try {
    const { period = 'monthly', marketplace } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const query = { saleDate: { $gte: startDate } };
    if (marketplace) query.marketplace = marketplace;

    const categoryPerformance = await Sale.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          totalRevenue: { $sum: '$finalAmount' },
          totalQuantity: { $sum: '$quantity' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    return ResponseUtils.success(res, categoryPerformance);
  } catch (error) {
    return next(error);
  }
});

// Get revenue trends over time
router.get('/revenue/trends', async (req, res, next) => {
  try {
    const { period = 'daily', days = 30, marketplace } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const query = { 
      saleDate: { $gte: startDate, $lte: endDate }
    };
    if (marketplace) query.marketplace = marketplace;

    let groupBy;
    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' },
          day: { $dayOfMonth: '$saleDate' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$saleDate' },
          week: { $week: '$saleDate' }
        };
        break;
      case 'monthly':
        groupBy = {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' }
        };
        break;
    }

    const trends = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return ResponseUtils.success(res, trends);
  } catch (error) {
    return next(error);
  }
});

// Get marketplace comparison
router.get('/marketplace/comparison', async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const comparison = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$marketplace',
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    return ResponseUtils.success(res, comparison);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
