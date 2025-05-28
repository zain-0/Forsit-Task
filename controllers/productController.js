const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const ResponseUtils = require('../utils/responseUtils');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

async function getAllProducts(req, res) {
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
}

async function getProductById(req, res) {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name');

  if (!product)
    throw new NotFoundError('Product not found');

  return ResponseUtils.success(res, product);
}

// TODO: move this to analytics controller
async function getProductProfit(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product)
    throw new NotFoundError('Product not found');

  const profitData = {
    productId: product._id,
    sku: product.sku,
    name: product.name,
    price: product.price,
    cost_price: product.cost_price,
    profitMargin: product.profitMargin,
    profit_amount: product.profit_amount
  };

  return ResponseUtils.success(res, profitData);
}

// Product creation endpoint
async function createProduct(req, res) {
  const {
    name,
    sku,
    description,
    category,
    brand,
    price,
    cost_price,
    marketplace = 'both',
    lowStockThreshold = 10,
    images = []
  } = req.body;

  // Check if SKU already exists
  const existingProduct = await Product.findOne({ sku });
  if (existingProduct) {
    throw new ConflictError('Product with this SKU already exists');
  }

  // Verify category exists
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc)
    throw new ValidationError('Invalid category ID');


  const product = new Product({
    name,
    sku,
    description,
    category,
    brand,
    price,
    cost_price,
    marketplace,
    lowStockThreshold,
    images,
    status: 'active'
  });

  await product.save();

  // Create initial inventory record
  const inventory = new Inventory({
    product: product._id,
    quantity: 0, // Start with 0, will be updated separately
    location: 'warehouse',
    lastUpdated: new Date()
  });
  await inventory.save();

  await product.populate('category', 'name');

  return ResponseUtils.created(res, product, 'Product created successfully');
}

async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  ).populate('category', 'name');

  if (!product)
    throw new NotFoundError('Product not found');

  return ResponseUtils.success(res, product, 'Product updated');
}

// soft delete
async function deleteProduct(req, res) {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { status: 'discontinued' },
    { new: true }
  );

  if (!product)
    throw new NotFoundError('Product not found');

  return ResponseUtils.success(res, null, 'Product discontinued');
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductProfit,
  createProduct,
  updateProduct,
  deleteProduct
}