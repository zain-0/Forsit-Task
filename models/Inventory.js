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
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0
  },
  location: {
    warehouse: String,
    shelf: String
  },
  cost_per_unit: {  // inconsistent with costPerUnit in other places
    type: Number,
    required: true
  },
  lastRestocked: Date
}, {
  timestamps: true
});

inventorySchema.virtual('availableStock').get(function() {
  const current = this.currentStock || 0;
  const reserved = this.reservedStock || 0;
  return current - reserved;
});

// check if stock is low - TODO: make this configurable
inventorySchema.virtual('isLowStock').get(function() {
  return this.availableStock <= 10; // magic number, should be from config
});

// Performance indexes for inventory queries
inventorySchema.index({ product: 1 }, { unique: true });
inventorySchema.index({ currentStock: 1 });
inventorySchema.index({ 'location.warehouse': 1 });
// Indexes for performance optimization
inventorySchema.index({ lastUpdated: 1 });
inventorySchema.index({ currentStock: 1, lastUpdated: 1 }); // Low stock queries
inventorySchema.index({ currentStock: 1, reservedStock: 1 }); // Available stock calculations

inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
