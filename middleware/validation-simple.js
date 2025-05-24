const Joi = require('joi');
const ResponseUtils = require('../utils/responseUtils');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
      }));
      
      return ResponseUtils.validationError(res, errors);
    }

    req[property] = value;
    next();
  };
};

const schemas = {
  createProduct: Joi.object({
    name: Joi.string().required().trim().max(255),
    sku: Joi.string().required().trim().max(100),
    description: Joi.string().trim().max(1000),
    category: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
    brand: Joi.string().trim().max(100),
    price: Joi.number().required().min(0),
    costPrice: Joi.number().required().min(0),
    marketplace: Joi.string().valid('amazon', 'ebay', 'both').default('both'),
    status: Joi.string().valid('active', 'inactive', 'discontinued').default('active')
  }),

  updateProduct: Joi.object({
    name: Joi.string().trim().max(255),
    description: Joi.string().trim().max(1000),
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    brand: Joi.string().trim().max(100),
    price: Joi.number().min(0),
    costPrice: Joi.number().min(0),
    marketplace: Joi.string().valid('amazon', 'ebay', 'both'),
    status: Joi.string().valid('active', 'inactive', 'discontinued')
  }),

  createSale: Joi.object({
    product: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
    marketplace: Joi.string().required().valid('amazon', 'ebay', 'both'),
    quantity: Joi.number().required().integer().min(1),
    originalPrice: Joi.number().required().min(0),
    finalAmount: Joi.number().required().min(0),
    fees: Joi.object({
      marketplace: Joi.number().min(0).default(0),
      payment: Joi.number().min(0).default(0),
      shipping: Joi.number().min(0).default(0)
    }).default({})
  }),

  mongoId: Joi.object({
    id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
  }),

  queryParams: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default('-createdAt'),
    search: Joi.string().trim(),
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    marketplace: Joi.string().valid('amazon', 'ebay', 'both'),
    status: Joi.string().valid('active', 'inactive', 'discontinued'),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0)
  })
};

module.exports = { validate, schemas };
