const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const ResponseUtils = require('../utils/responseUtils');
const { NotFoundError, ValidationError } = require('../utils/errors');

// Get all sales
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-saleDate',
      marketplace,
      startDate,
      endDate
    } = req.query;

    const query = {};
    
    if (marketplace) query.marketplace = marketplace;
    
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('product', 'name sku brand')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Sale.countDocuments(query)
    ]);

    return ResponseUtils.paginated(res, sales, { page, limit, total });
  } catch (error) {
    return next(error);
  }
});

// Get sale by ID
router.get('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('product', 'name sku brand category')
      .lean();

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    return ResponseUtils.success(res, sale);
  } catch (error) {
    return next(error);
  }
});

// Create new sale
router.post('/', async (req, res, next) => {
  try {
    const { product, marketplace, quantity, originalPrice, finalAmount, fees } = req.body;

    // Verify product exists
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      throw new ValidationError('Product not found');
    }

    const sale = new Sale({
      product,
      marketplace,
      quantity,
      originalPrice,
      finalAmount,
      fees: fees || {},
      saleDate: new Date()
    });

    await sale.save();
    await sale.populate('product', 'name sku brand');

    return ResponseUtils.success(res, sale, 'Sale created successfully', 201);
  } catch (error) {
    return next(error);
  }
});

// Update sale
router.put('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    // If product is being updated, verify it exists
    if (req.body.product) {
      const product = await Product.findById(req.body.product);
      if (!product) {
        throw new ValidationError('Product not found');
      }
    }

    Object.assign(sale, req.body);
    await sale.save();
    await sale.populate('product', 'name sku brand');

    return ResponseUtils.success(res, sale, 'Sale updated successfully');
  } catch (error) {
    return next(error);
  }
});

// Delete sale
router.delete('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    await Sale.findByIdAndDelete(req.params.id);

    return ResponseUtils.success(res, null, 'Sale deleted successfully');
  } catch (error) {
    return next(error);
  }
});

// Get sales summary
router.get('/summary/overview', async (req, res, next) => {
  try {
    const { marketplace, period = 'monthly' } = req.query;

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
      case 'yearly':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const query = { saleDate: { $gte: startDate } };
    if (marketplace) query.marketplace = marketplace;

    const summary = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          totalQuantity: { $sum: '$quantity' },
          averageOrderValue: { $avg: '$finalAmount' },
          totalFees: { $sum: { $add: ['$fees.marketplace', '$fees.payment', '$fees.shipping'] } }
        }
      }
    ]);

    const result = summary[0] || {
      totalSales: 0,
      totalRevenue: 0,
      totalQuantity: 0,
      averageOrderValue: 0,
      totalFees: 0
    };

    return ResponseUtils.success(res, {
      period,
      dateRange: { startDate, endDate: new Date() },
      ...result
    });
  } catch (error) {
    return next(error);
  }
});

// Get recent sales
router.get('/recent/latest', async (req, res, next) => {
  try {
    const { limit = 10, marketplace } = req.query;

    const query = {};
    if (marketplace) query.marketplace = marketplace;

    const recentSales = await Sale.find(query)
      .populate('product', 'name sku brand')
      .sort('-saleDate')
      .limit(parseInt(limit))
      .lean();

    return ResponseUtils.success(res, recentSales);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
