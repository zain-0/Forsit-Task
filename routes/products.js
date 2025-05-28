const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validate, schemas } = require('../middleware/validation');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// TODO: move to analytics routes
router.get('/:id/profit', productController.getProductProfit);

router.post('/', validate(schemas.createProduct), productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;