const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  finalAmount: {
    type: Number,
    required: true
  },
  marketplace: {
    type: String,
    required: true
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  fees: {
    marketplace: { type: Number, default: 0 },
    payment: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// TODO: cache this calculation for performance
saleSchema.virtual('totalFees').get(function () {
  return (this.fees?.marketplace || 0) + (this.fees?.payment || 0) + (this.fees?.shipping || 0);
});

saleSchema.virtual('netAmount').get(function () {
  return this.finalAmount - this.totalFees;
});

saleSchema.index({ saleDate: -1 });
// Performance indexes for analytics queries
saleSchema.index({ saleDate: 1 });
saleSchema.index({ marketplace: 1 });
saleSchema.index({ saleDate: 1, marketplace: 1 });
saleSchema.index({ product: 1, saleDate: 1 });
saleSchema.index({ marketplace: 1, saleDate: 1 });
saleSchema.index({ finalAmount: 1 });

saleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Sale', saleSchema);
