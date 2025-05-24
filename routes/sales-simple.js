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

    const skip = (page - 1) * limit;
    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('product', 'name sku')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
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
      .populate('product', 'name sku brand');

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
    const product = await Product.findById(req.body.product);
    if (!product) {
      throw new ValidationError('Product not found');
    }

    const sale = new Sale(req.body);
    await sale.save();
    await sale.populate('product', 'name sku');

    return ResponseUtils.success(res, sale, 'Sale created successfully', 201);
  } catch (error) {
    return next(error);
  }
});

// Update sale
router.put('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('product', 'name sku');

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    return ResponseUtils.success(res, sale, 'Sale updated successfully');
  } catch (error) {
    return next(error);
  }
});

// Delete sale
router.delete('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    return ResponseUtils.success(res, null, 'Sale deleted successfully');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
