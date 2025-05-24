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
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  marketplace: {
    type: String,
    enum: ['amazon', 'walmart'],
    required: true
  },
  customer: {
    customerId: String,
    name: String,
    email: String,
    location: {
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  shippingInfo: {
    carrier: String,
    trackingNumber: String,
    shippedDate: Date,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  saleDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  refundInfo: {
    isRefunded: {
      type: Boolean,
      default: false
    },
    refundAmount: Number,
    refundDate: Date,
    refundReason: String
  },
  notes: String
}, {
  timestamps: true
});

// Virtual for profit calculation
saleSchema.virtual('profit').get(function() {
  // This would need the product's cost price - we'll populate it in queries
  return this.finalAmount - (this.quantity * (this.populated('product')?.costPrice || 0));
});

// Indexes for optimal query performance
// Note: orderId already has unique index from schema definition
saleSchema.index({ product: 1 });
saleSchema.index({ marketplace: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ orderStatus: 1 });
saleSchema.index({ 'customer.customerId': 1 });
saleSchema.index({ finalAmount: 1 });
saleSchema.index({ createdAt: -1 });

// Compound indexes for analytics
saleSchema.index({ saleDate: 1, marketplace: 1 });
saleSchema.index({ saleDate: 1, product: 1 });
saleSchema.index({ marketplace: 1, orderStatus: 1 });

// Ensure virtual fields are serialized
saleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Sale', saleSchema);
