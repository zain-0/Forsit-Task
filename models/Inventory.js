const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    warehouse: {
      type: String,
      required: true
    },
    shelf: String,
    bin: String
  },
  supplier: {
    name: String,
    contactInfo: String
  },
  reorderPoint: {
    type: Number,
    default: 10
  },
  reorderQuantity: {
    type: Number,
    default: 50
  },
  lastRestocked: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  batchNumber: String,
  costPerUnit: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Virtual for available stock (current - reserved)
inventorySchema.virtual('availableStock').get(function() {
  return this.currentStock - this.reservedStock;
});

// Virtual to check if stock is low
inventorySchema.virtual('isLowStock').get(function() {
  return this.availableStock <= this.reorderPoint;
});

// Indexes
inventorySchema.index({ product: 1 });
inventorySchema.index({ 'location.warehouse': 1 });
inventorySchema.index({ currentStock: 1 });
inventorySchema.index({ lastRestocked: -1 });
inventorySchema.index({ expiryDate: 1 });

// Ensure virtual fields are serialized
inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
