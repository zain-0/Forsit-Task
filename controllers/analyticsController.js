const Sale = require('../models/Sale');
const ResponseUtils = require('../utils/responseUtils');

// Utility to calculate start date based on period
function calculateStartDate(period, count = 1) {
  const date = new Date();
  switch (period) {
    case 'daily':
      date.setDate(date.getDate() - count);
      break;
    case 'weekly':
      date.setDate(date.getDate() - count * 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() - count);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() - count);
      break;
  }
  return date;
}

exports.getRevenueSummary = async (req, res) => {
  const period = req.query.period || 'monthly';
  const startDate = calculateStartDate(period);

  try {
    const result = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' },
        },
      },
    ]);

    const data = result[0] || { totalRevenue: 0, totalSales: 0, averageOrderValue: 0 };
    return ResponseUtils.success(res, data);
  } catch (err) {
    return ResponseUtils.error(res, 'Failed to fetch revenue summary', 500);
  }
};

exports.getTopSellingProducts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const startDate = calculateStartDate('daily', 30);

  try {
    const result = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$finalAmount' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          name: '$productInfo.name',
          sku: '$productInfo.sku',
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]);

    return ResponseUtils.success(res, result);
  } catch (err) {
    return ResponseUtils.error(res, 'Failed to fetch top products', 500);
  }
};

exports.getSalesTrends = async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const startDate = calculateStartDate('daily', days);

  try {
    const trends = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
            day: { $dayOfMonth: '$saleDate' },
          },
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return ResponseUtils.success(res, trends);
  } catch (err) {
    return ResponseUtils.error(res, 'Failed to fetch sales trends', 500);
  }
};

exports.getDailyRevenue = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = calculateStartDate('daily', days);

  try {
    const data = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
            day: { $dayOfMonth: '$saleDate' },
          },
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          totalRevenue: 1,
          totalSales: 1,
          totalQuantity: 1,
          averageOrderValue: { $divide: ['$totalRevenue', '$totalSales'] },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return ResponseUtils.success(res, { period: 'daily', data });
  } catch (err) {
    return ResponseUtils.error(res, 'Failed to fetch daily revenue', 500);
  }
};

exports.getWeeklyRevenue = async (req, res) => {
  const weeks = parseInt(req.query.weeks) || 12;
  const startDate = calculateStartDate('weekly', weeks);

  try {
    const data = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            week: { $week: '$saleDate' },
          },
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $project: {
          year: '$_id.year',
          week: '$_id.week',
          totalRevenue: 1,
          totalSales: 1,
          totalQuantity: 1,
          averageOrderValue: { $divide: ['$totalRevenue', '$totalSales'] },
        },
      },
      { $sort: { year: 1, week: 1 } },
    ]);

    return ResponseUtils.success(res, { period: 'weekly', data });
  } catch (err) {
    return ResponseUtils.error(res, 'Failed to fetch weekly revenue', 500);
  }
};

exports.getMonthlyRevenue = async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const startDate = calculateStartDate('monthly', months);

  try {
    const data = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
          },
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          totalRevenue: 1,
          totalSales: 1,
          totalQuantity: 1,
          averageOrderValue: { $divide: ['$totalRevenue', '$totalSales'] },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    return ResponseUtils.success(res, { period: 'monthly', data });
  } catch (err) {
    return ResponseUtils.error(res, 'Failed to fetch monthly revenue', 500);
  }
};

exports.getAnnualRevenue = async (req, res) => {
  const years = parseInt(req.query.years) || 3;
  const startDate = calculateStartDate('annual', years);

  try {
    const data = await Sale.aggregate([
      { $match: { saleDate: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$saleDate' } },
          totalRevenue: { $sum: '$finalAmount' },
          totalSales: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $project: {
          year: '$_id.year',
          totalRevenue: 1,
          totalSales: 1,
          totalQuantity: 1,
          averageOrderValue: { $divide: ['$totalRevenue', '$totalSales'] },
        },
      },
      { $sort: { year: 1 } },
    ]);

    return ResponseUtils.success(res, { period: 'annual', data });
  } catch (err) {
    return ResponseUtils.error(res, 'Failed to fetch annual revenue', 500);
  }
};

exports.getRevenueComparison = async (req, res) => {
  const { period1, period2, type = 'monthly' } = req.query;

  if (!period1 || !period2) {
    return ResponseUtils.error(res, 'Both period1 and period2 are required', 400);
  }

  const start1 = new Date(period1);
  const start2 = new Date(period2);
  const end1 = new Date(start1);
  const end2 = new Date(start2);

  switch (type) {
    case 'daily':
      end1.setDate(end1.getDate() + 1);
      end2.setDate(end2.getDate() + 1);
      break;
    case 'weekly':
      end1.setDate(end1.getDate() + 7);
      end2.setDate(end2.getDate() + 7);
      break;
    case 'monthly':
      end1.setMonth(end1.getMonth() + 1);
      end2.setMonth(end2.getMonth() + 1);
      break;
    case 'annual':
      end1.setFullYear(end1.getFullYear() + 1);
      end2.setFullYear(end2.getFullYear() + 1);
      break;
  }

  try {
    const [p1, p2] = await Promise.all([
      Sale.aggregate([
        { $match: { saleDate: { $gte: start1, $lt: end1 } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmount' },
            totalSales: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
          },
        },
      ]),
      Sale.aggregate([
        { $match: { saleDate: { $gte: start2, $lt: end2 } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmount' },
            totalSales: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
          },
        },
      ]),
    ]);

    const d1 = p1[0] || { totalRevenue: 0, totalSales: 0, totalQuantity: 0 };
    const d2 = p2[0] || { totalRevenue: 0, totalSales: 0, totalQuantity: 0 };

    const comparison = {
      period1: { start: start1, end: end1, ...d1 },
      period2: { start: start2, end: end2, ...d2 },
      comparison: {
        revenueChange: d1.totalRevenue - d2.totalRevenue,
        revenueChangePercent: d2.totalRevenue
          ? ((d1.totalRevenue - d2.totalRevenue) / d2.totalRevenue) * 100
          : 0,
        salesChange: d1.totalSales - d2.totalSales,
        quantityChange: d1.totalQuantity - d2.totalQuantity,
      },
    };

    return ResponseUtils.success(res, comparison);
  } catch (err) {
    return ResponseUtils.error(res, 'Failed to compare revenue periods', 500);
  }
};
