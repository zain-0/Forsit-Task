const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => d.message)
      });
    }
    next();
  };
};

const schemas = {
  createProduct: Joi.object({
    name: Joi.string().required(),
    sku: Joi.string().required(),
    description: Joi.string(),
    category: Joi.string().required(),
    brand: Joi.string(),
    price: Joi.number().required().min(0),
    cost_price: Joi.number().required().min(0),  // matches model field name
    marketplace: Joi.string().valid('amazon', 'walmart', 'both').default('both'),
    lowStockThreshold: Joi.number().min(0).default(10),
    images: Joi.array().items(Joi.object())
  }),

  createSale: Joi.object({
    product: Joi.string().required(),
    marketplace: Joi.string().required(),
    quantity: Joi.number().required().min(1),
    originalPrice: Joi.number().required().min(0),
    finalAmount: Joi.number().required().min(0)
  }),

  updateInventory: Joi.object({
    quantity: Joi.number().required().min(0),
    operation: Joi.string().valid('set', 'add', 'subtract').default('set'),
    reason: Joi.string().default('manual_adjustment'),
    notes: Joi.string()
  }),

  updateInventoryLevels: Joi.object({
    quantity: Joi.number().required().min(0),
    reason: Joi.string().required().min(3),
    reference: Joi.string()
  }),

  bulkInventoryUpdate: Joi.object({
    updates: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().required().min(0),
        operation: Joi.string().valid('set', 'add', 'subtract').default('set'),
        reason: Joi.string().default('bulk_update')
      })
    ).required().min(1)
  }),

  createCategory: Joi.object({
    name: Joi.string().required().min(2),
    description: Joi.string(),
    parentCategory: Joi.string()
  }),

  updateProduct: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    brand: Joi.string(),
    price: Joi.number().min(0),
    cost_price: Joi.number().min(0),
    marketplace: Joi.string().valid('amazon', 'walmart', 'both'),
    lowStockThreshold: Joi.number().min(0),
    status: Joi.string().valid('active', 'inactive', 'discontinued'),
    images: Joi.array().items(Joi.object())
  }),

  updateSale: Joi.object({
    quantity: Joi.number().min(1),
    originalPrice: Joi.number().min(0),
    finalAmount: Joi.number().min(0),
    marketplace: Joi.string().valid('amazon', 'walmart'),
    fees: Joi.object({
      marketplace: Joi.number().min(0),
      payment: Joi.number().min(0),
      shipping: Joi.number().min(0)
    })
  })
};

module.exports = { validate, schemas };