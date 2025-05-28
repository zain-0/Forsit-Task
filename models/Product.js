const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: String,
  price: {
    type: Number,
    required: true
  },
  cost_price: {  // inconsistent naming - should be costPrice but human mistake
    type: Number,
    required: true
  },
  marketplace: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'active'
  }
}, {
  timestamps: true
});

// FIXME: move this to utils later
productSchema.virtual('profitMargin').get(function () {
  return ((this.price - this.cost_price) / this.price * 100).toFixed(2);
});

productSchema.virtual('profit_amount').get(function () {
  return this.price - this.cost_price;
});

// Performance indexes for search and filtering
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ marketplace: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ category: 1, price: 1 }); // Compound for category + price filtering
productSchema.index({ marketplace: 1, status: 1 }); // Compound for marketplace filtering

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
