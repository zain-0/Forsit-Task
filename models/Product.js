const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inch'],
      default: 'cm'
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  marketplace: {
    type: String,
    enum: ['amazon', 'walmart', 'both'],
    required: true
  },
  // SEO fields
  metaTitle: String,
  metaDescription: String,
  // Inventory tracking
  lowStockThreshold: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

// Indexes for optimal performance
// Note: sku already has unique index from schema definition
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ marketplace: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search index
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  return ((this.price - this.costPrice) / this.price * 100).toFixed(2);
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
