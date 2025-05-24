const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const ResponseUtils = require('../utils/responseUtils');
const { NotFoundError, ValidationError } = require('../utils/errors');

// Get all inventory
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-updatedAt',
      search,
      warehouse,
      lowStock = false
    } = req.query;

    let query = {};
    if (warehouse) query['location.warehouse'] = warehouse;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let inventoryQuery = Inventory.find(query)
      .populate('product', 'name sku brand lowStockThreshold')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    if (search) {
      // We'll need to use aggregation for search across populated fields
      const inventory = await Inventory.aggregate([
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
          $match: {
            $or: [
              { 'product.name': { $regex: search, $options: 'i' } },
              { 'product.sku': { $regex: search, $options: 'i' } },
              { 'product.brand': { $regex: search, $options: 'i' } }
            ]
          }
        },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);

      const total = await Inventory.aggregate([
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
          $match: {
            $or: [
              { 'product.name': { $regex: search, $options: 'i' } },
              { 'product.sku': { $regex: search, $options: 'i' } },
              { 'product.brand': { $regex: search, $options: 'i' } }
            ]
          }
        },
        { $count: 'total' }
      ]);

      return ResponseUtils.paginated(res, inventory, { 
        page, 
        limit, 
        total: total[0]?.total || 0 
      });
    }

    if (lowStock === 'true') {
      inventoryQuery = inventoryQuery.where('currentStock').lte(10);
    }

    const [inventory, total] = await Promise.all([
      inventoryQuery.lean(),
      Inventory.countDocuments(query)
    ]);

    return ResponseUtils.paginated(res, inventory, { page, limit, total });
  } catch (error) {
    return next(error);
  }
});

// Get inventory by product ID
router.get('/product/:productId', async (req, res, next) => {
  try {
    const inventory = await Inventory.findOne({ product: req.params.productId })
      .populate('product', 'name sku brand')
      .lean();

    if (!inventory) {
      throw new NotFoundError('Inventory not found for this product');
    }

    return ResponseUtils.success(res, inventory);
  } catch (error) {
    return next(error);
  }
});

// Update inventory stock
router.put('/:id/stock', async (req, res, next) => {
  try {
    const { quantity, type, reason } = req.body;

    if (!quantity || !type || !['add', 'remove', 'set'].includes(type)) {
      throw new ValidationError('Valid quantity and type (add/remove/set) are required');
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      throw new NotFoundError('Inventory not found');
    }

    const oldStock = inventory.currentStock;
    let newStock;

    switch (type) {
      case 'add':
        newStock = oldStock + parseInt(quantity);
        break;
      case 'remove':
        newStock = Math.max(0, oldStock - parseInt(quantity));
        break;
      case 'set':
        newStock = parseInt(quantity);
        break;
    }

    inventory.currentStock = newStock;
    inventory.lastUpdated = new Date();
    await inventory.save();

    // Create transaction record
    const transaction = new InventoryTransaction({
      inventory: inventory._id,
      product: inventory.product,
      type: type === 'add' ? 'stock_in' : 'stock_out',
      quantity: Math.abs(newStock - oldStock),
      reason: reason || `Manual ${type}`,
      previousStock: oldStock,
      newStock: newStock,
      performedBy: 'system' // In a real app, this would be the user ID
    });
    await transaction.save();

    await inventory.populate('product', 'name sku');

    return ResponseUtils.success(res, inventory, 'Stock updated successfully');
  } catch (error) {
    return next(error);
  }
});

// Get inventory transactions
router.get('/:id/transactions', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      InventoryTransaction.find({ inventory: req.params.id })
        .populate('product', 'name sku')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      InventoryTransaction.countDocuments({ inventory: req.params.id })
    ]);

    return ResponseUtils.paginated(res, transactions, { page, limit, total });
  } catch (error) {
    return next(error);
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res, next) => {
  try {
    const lowStockItems = await Inventory.aggregate([
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
        $addFields: {
          availableStock: { $subtract: ['$currentStock', '$reservedStock'] }
        }
      },
      {
        $match: {
          $expr: { $lte: ['$availableStock', '$product.lowStockThreshold'] },
          'product.status': 'active'
        }
      },
      {
        $project: {
          'product.name': 1,
          'product.sku': 1,
          'product.brand': 1,
          'product.lowStockThreshold': 1,
          currentStock: 1,
          reservedStock: 1,
          availableStock: 1,
          reorderPoint: 1,
          reorderQuantity: 1
        }
      },
      { $sort: { availableStock: 1 } }
    ]);

    return ResponseUtils.success(res, lowStockItems, `Found ${lowStockItems.length} low stock items`);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
