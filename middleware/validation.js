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
    costPrice: Joi.number().required().min(0)
  }),

  createSale: Joi.object({
    product: Joi.string().required(),
    marketplace: Joi.string().required(),
    quantity: Joi.number().required().min(1),
    originalPrice: Joi.number().required().min(0),
    finalAmount: Joi.number().required().min(0)
  })
};

module.exports = { validate, schemas };