const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const ResponseUtils = require('../utils/responseUtils');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

// Get all products
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      search,
      category,
      status = 'active'
    } = req.query;

    const query = { status };
    if (category) query.category = category;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    return ResponseUtils.paginated(res, products, { page, limit, total });
  } catch (error) {
    return next(error);
  }
});

// Get product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name');

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return ResponseUtils.success(res, product);
  } catch (error) {
    return next(error);
  }
});

// Create new product
router.post('/', async (req, res, next) => {
  try {
    const existingSku = await Product.findOne({ sku: req.body.sku });
    if (existingSku) {
      throw new ConflictError('SKU already exists');
    }

    const product = new Product(req.body);
    await product.save();
    await product.populate('category', 'name');

    return ResponseUtils.success(res, product, 'Product created', 201);
  } catch (error) {
    return next(error);
  }
});

// Update product
router.put('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('category', 'name');

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return ResponseUtils.success(res, product, 'Product updated');
  } catch (error) {
    return next(error);
  }
});

// Delete product
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'discontinued' },
      { new: true }
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return ResponseUtils.success(res, null, 'Product discontinued');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;