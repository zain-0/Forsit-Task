const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const ResponseUtils = require('../utils/responseUtils');
const { NotFoundError, ValidationError } = require('../utils/errors');

async function getAllInventory(req, res) {
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
    // HACK: aggregation needed for search across populated fields
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
}

async function getInventoryByProduct(req, res) {
  const inventory = await Inventory.findOne({ product: req.params.productId })
    .populate('product', 'name sku brand')
    .lean();

  if (!inventory) {
    throw new NotFoundError('Inventory not found for this product');
  }

  return ResponseUtils.success(res, inventory);
}

// TODO: move this to inventory status endpoint
async function getInventoryStatus(req, res) {
  const inventory = await Inventory.findById(req.params.id)
    .populate('product', 'name sku');

  if (!inventory) {
    throw new NotFoundError('Inventory not found');
  }

  const statusData = {
    inventoryId: inventory._id,
    product: inventory.product,
    currentStock: inventory.currentStock,
    reservedStock: inventory.reservedStock,
    availableStock: inventory.availableStock,
    isLowStock: inventory.isLowStock,
    location: inventory.location
  };

  return ResponseUtils.success(res, statusData);
}

async function updateInventoryStock(req, res) {
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
    product: inventory.product,
    txn_type: type === 'add' ? 'stock_in' : 'stock_out',
    qty: Math.abs(newStock - oldStock),
    reason: reason || `Manual ${type}`,
    ref_id: `ADJ-${Date.now()}`
  });
  await transaction.save();

  await inventory.populate('product', 'name sku');

  return ResponseUtils.success(res, inventory, 'Stock updated successfully');
}

async function getInventoryTransactions(req, res) {
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
}

// FIXME: should use proper configurable thresholds
async function getLowStockItems(req, res) {
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
}

// Update inventory levels
async function updateInventoryLevels(req, res) {
  const { id } = req.params;
  const {
    quantity,
    operation = 'set', // 'set', 'add', 'subtract'
    reason = 'manual_adjustment',
    notes
  } = req.body;

  const inventory = await Inventory.findById(id).populate('product');
  if (!inventory)
    throw new NotFoundError('Inventory record not found');


  let newQuantity;
  let changeAmount;

  switch (operation) {
    case 'add':
      newQuantity = inventory.currentStock + parseInt(quantity);
      changeAmount = parseInt(quantity);
      break;
    case 'subtract':
      newQuantity = Math.max(0, inventory.currentStock - parseInt(quantity));
      changeAmount = -parseInt(quantity);
      break;
    case 'set':
    default:
      newQuantity = parseInt(quantity);
      changeAmount = newQuantity - inventory.currentStock;
      break;
  }

  // Update inventory
  inventory.currentStock = newQuantity;
  inventory.lastUpdated = new Date();
  await inventory.save();

  // Create transaction record
  const transaction = new InventoryTransaction({
    product: inventory.product._id,
    type: changeAmount > 0 ? 'stock_in' : 'stock_out',
    quantity: Math.abs(changeAmount),
    reason,
    notes,
    balanceAfter: newQuantity
  });
  await transaction.save();

  return ResponseUtils.success(res, {
    inventory,
    transaction,
    change: changeAmount
  }, 'Inventory updated successfully');
}

// Update inventory levels with transaction tracking
async function updateInventoryLevels(req, res) {

  const { id } = req.params;
  const { quantity, reason, reference } = req.body;

  if (!quantity || !reason)
    throw new ValidationError('Quantity and reason are required');

  const inventory = await Inventory.findById(id).populate('product', 'name sku');
  if (!inventory)
    throw new NotFoundError('Inventory record not found');


  const oldQuantity = inventory.currentStock;
  const newQuantity = parseInt(quantity);
  const difference = newQuantity - oldQuantity;

  // Update inventory
  inventory.currentStock = newQuantity;
  inventory.lastUpdated = new Date();
  await inventory.save();

  // Create transaction record
  const transaction = new InventoryTransaction({
    product: inventory.product._id,
    txn_type: difference > 0 ? 'inbound' : 'outbound',
    qty: Math.abs(difference),
    reason,
    ref_id: reference || `ADJ-${Date.now()}`
  });
  await transaction.save();

  return ResponseUtils.success(res, {
    inventory,
    transaction,
    change: {
      from: oldQuantity,
      to: newQuantity,
      difference
    }
  }, 'Inventory levels updated successfully');
}

// Get inventory change history for a product
async function getInventoryHistory(req, res) {
  const { productId } = req.params;
  const { page = 1, limit = 20, startDate, endDate } = req.query;

  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  let query = { product: productId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [transactions, total] = await Promise.all([
    InventoryTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    InventoryTransaction.countDocuments(query)
  ]);

  // Get current inventory status
  const currentInventory = await Inventory.findOne({ product: productId });

  return ResponseUtils.paginated(res, transactions, {
    page,
    limit,
    total,
    productInfo: {
      name: product.name,
      sku: product.sku,
      currentStock: currentInventory?.currentStock || 0
    }
  });
}

// Bulk inventory update
async function bulkUpdateInventory(req, res) {
  const { updates } = req.body; // Array of {productId, quantity, reason}

  if (!updates || !Array.isArray(updates))
    throw new ValidationError('Updates array is required');


  const results = [];
  const transactions = [];

  for (const update of updates) {
    const { productId, quantity, reason, reference } = update;
    if (!productId || !quantity || isNan(quantity) || !reason || !reference)
      throw new ValidationError('Each update must include productId, quantity, reason, and reference');

    const inventory = await Inventory.findOne({ product: productId });
    if (!inventory) {
      results.push({ productId, error: 'Inventory record not found' });
      continue;
    }

    const oldQuantity = inventory.currentStock;
    const newQuantity = parseInt(quantity);
    const difference = newQuantity - oldQuantity;

    // Update inventory
    inventory.currentStock = newQuantity;
    inventory.lastUpdated = new Date();
    await inventory.save();

    // Create transaction
    const transaction = new InventoryTransaction({
      product: productId,
      txn_type: difference > 0 ? 'inbound' : 'outbound',
      qty: Math.abs(difference),
      reason: reason || 'Bulk update',
      ref_id: reference || `BULK-${Date.now()}-${productId}`
    });
    await transaction.save();

    results.push({
      productId,
      success: true,
      change: { from: oldQuantity, to: newQuantity, difference }
    });
    transactions.push(transaction);
  }

  return ResponseUtils.success(res, {
    results,
    totalUpdated: results.filter(x => x.success).length,
    totalErrors: results.filter(x => x.error).length,
    transactions
  }, 'Bulk inventory update completed');
}


module.exports = {
  getAllInventory,
  getInventoryByProduct,
  getInventoryStatus,
  updateInventoryStock,
  getInventoryTransactions,
  getLowStockItems,
  updateInventoryLevels,
  getInventoryHistory,
  bulkUpdateInventory
};
