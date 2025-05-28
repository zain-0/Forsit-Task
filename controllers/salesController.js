const Sale = require('../models/Sale');
const Product = require('../models/Product');
const ResponseUtils = require('../utils/responseUtils');
const { NotFoundError, ValidationError } = require('../utils/errors');
const mongoose = require('mongoose');

async function getAllSales(req, res) {
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
}

async function getSaleById(req, res) {
  const sale = await Sale.findById(req.params.id)
    .populate('product', 'name sku brand category')
    .lean();

  if (!sale) {
    throw new NotFoundError('Sale not found');
  }

  return ResponseUtils.success(res, sale);
}

// TODO: this should be combined with getSaleById
async function getSaleFinancials(req, res) {
  const sale = await Sale.findById(req.params.id)
    .populate('product', 'name sku');

  if (!sale) {
    throw new NotFoundError('Sale not found');
  }

  const financialData = {
    saleId: sale._id,
    orderId: sale.orderId,
    product: sale.product,
    finalAmount: sale.finalAmount,
    totalFees: sale.totalFees,
    netAmount: sale.netAmount,
    fees: sale.fees
  };

  return ResponseUtils.success(res, financialData);
}

async function createSale(req, res) {
  const { product, marketplace, quantity, originalPrice, finalAmount, fees } = req.body;

  const productDoc = await Product.findById(product);
  if (!productDoc)
    throw new ValidationError('Product not found');


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
}

async function updateSale(req, res) {
  const sale = await Sale.findById(req.params.id);
  if (!sale)
    throw new NotFoundError('Sale not found');


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
}

async function deleteSale(req, res) {
  const sale = await Sale.findById(req.params.id);
  if (!sale) {
    throw new NotFoundError('Sale not found');
  }

  await Sale.findByIdAndDelete(req.params.id);
  return ResponseUtils.success(res, null, 'Sale deleted successfully');
}

// TODO: cache this aggregation
async function getSalesSummary(req, res) {
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
}

async function getRecentSales(req, res) {
  const { limit = 10, marketplace } = req.query;

  const query = {};
  if (marketplace) query.marketplace = marketplace;

  const recentSales = await Sale.find(query)
    .populate('product', 'name sku brand')
    .sort('-saleDate')
    .limit(parseInt(limit))
    .lean();

  return ResponseUtils.success(res, recentSales);
}

// Advanced sales filtering
async function getFilteredSales(req, res) {
  const {
    page = 1,
    limit = 10,
    sort = '-saleDate',
    marketplace,
    startDate,
    endDate,
    product,
    category,
    minAmount,
    maxAmount,
    brand
  } = req.query;

  const query = {};

  // Date range filtering
  if (startDate || endDate) {
    query.saleDate = {};
    if (startDate) query.saleDate.$gte = new Date(startDate);
    if (endDate) query.saleDate.$lte = new Date(endDate);
  }

  // Marketplace filtering
  if (marketplace) query.marketplace = marketplace;

  // Amount range filtering
  if (minAmount || maxAmount) {
    query.finalAmount = {};
    if (minAmount) query.finalAmount.$gte = parseFloat(minAmount);
    if (maxAmount) query.finalAmount.$lte = parseFloat(maxAmount);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build aggregation pipeline for complex filtering
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $lookup: {
        from: 'categories',
        localField: 'productInfo.category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } }
  ];

  // Additional filters based on product/category
  const additionalMatch = {};
  if (product) additionalMatch['productInfo._id'] = new mongoose.Types.ObjectId(product);
  if (category) additionalMatch['categoryInfo._id'] = new mongoose.Types.ObjectId(category);
  if (brand) additionalMatch['productInfo.brand'] = { $regex: brand, $options: 'i' };

  if (Object.keys(additionalMatch).length > 0) {
    pipeline.push({ $match: additionalMatch });
  }

  // Add sorting, pagination
  pipeline.push(
    { $sort: { [sort.startsWith('-') ? sort.slice(1) : sort]: sort.startsWith('-') ? -1 : 1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    {
      $project: {
        _id: 1,
        quantity: 1,
        originalPrice: 1,
        finalAmount: 1,
        marketplace: 1,
        saleDate: 1,
        fees: 1,
        'productInfo.name': 1,
        'productInfo.sku': 1,
        'productInfo.brand': 1,
        'categoryInfo.name': 1
      }
    }
  );

  // Count pipeline for total
  const countPipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $lookup: {
        from: 'categories',
        localField: 'productInfo.category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } }
  ];

  if (Object.keys(additionalMatch).length > 0) {
    countPipeline.push({ $match: additionalMatch });
  }
  countPipeline.push({ $count: 'total' });

  const [sales, totalResult] = await Promise.all([
    Sale.aggregate(pipeline),
    Sale.aggregate(countPipeline)
  ]);

  const total = totalResult[0]?.total || 0;

  return ResponseUtils.paginated(res, sales, { page, limit, total });
}

module.exports = {
  getAllSales,
  getSaleById,
  getSaleFinancials,
  createSale,
  updateSale,
  deleteSale,
  getSalesSummary,
  getRecentSales,
  getFilteredSales
};