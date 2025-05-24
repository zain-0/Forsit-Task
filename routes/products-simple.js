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
      marketplace,
      status = 'active',
      minPrice,
      maxPrice
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (marketplace && marketplace !== 'both') query.marketplace = { $in: [marketplace, 'both'] };
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    return ResponseUtils.paginated(res, products, { page, limit, total });
  } catch (error) {
    return next(error);
  }
});

// Get low stock products
router.get('/alerts/low-stock', async (req, res, next) => {
  try {
    const lowStockProducts = await Product.aggregate([
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'product',
          as: 'inventory'
        }
      },
      { $unwind: '$inventory' },
      {
        $addFields: {
          availableStock: {
            $subtract: ['$inventory.currentStock', '$inventory.reservedStock']
          }
        }
      },
      {
        $match: {
          $expr: { $lte: ['$availableStock', '$lowStockThreshold'] },
          status: 'active'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          name: 1,
          sku: 1,
          brand: 1,
          'category.name': 1,
          lowStockThreshold: 1,
          availableStock: 1,
          currentStock: '$inventory.currentStock',
          reservedStock: '$inventory.reservedStock'
        }
      },
      { $sort: { availableStock: 1 } }
    ]);

    return ResponseUtils.success(res, lowStockProducts, `Found ${lowStockProducts.length} products with low stock`);
  } catch (error) {
    return next(error);
  }
});

// Get product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .lean();

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const inventory = await Inventory.findOne({ product: req.params.id }).lean();

    const productWithInventory = {
      ...product,
      inventory
    };

    return ResponseUtils.success(res, productWithInventory);
  } catch (error) {
    return next(error);
  }
});

// Create new product
router.post('/', async (req, res, next) => {
  try {
    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku: req.body.sku });
    if (existingSku) {
      throw new ConflictError('Product with this SKU already exists');
    }

    // Verify category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      throw new ValidationError('Category not found');
    }

    const product = new Product(req.body);
    await product.save();

    // Create initial inventory record
    const inventory = new Inventory({
      product: product._id,
      currentStock: 0,
      location: { warehouse: 'Main Warehouse' },
      costPerUnit: req.body.costPrice
    });
    await inventory.save();

    await product.populate('category', 'name');

    return ResponseUtils.success(res, product, 'Product created successfully', 201);
  } catch (error) {
    return next(error);
  }
});

// Update product
router.put('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // If category is being updated, verify it exists
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        throw new ValidationError('Category not found');
      }
    }

    Object.assign(product, req.body);
    await product.save();
    await product.populate('category', 'name');

    return ResponseUtils.success(res, product, 'Product updated successfully');
  } catch (error) {
    return next(error);
  }
});

// Delete product (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    product.status = 'discontinued';
    await product.save();

    return ResponseUtils.success(res, null, 'Product discontinued successfully');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
