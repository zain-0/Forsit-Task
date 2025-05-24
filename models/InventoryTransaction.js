const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['inbound', 'outbound', 'adjustment', 'transfer', 'return'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  reference: {
    type: String, // Could be order ID, transfer ID, etc.
  },
  performedBy: {
    userId: String,
    userName: String
  },
  notes: String,
  cost: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
inventoryTransactionSchema.index({ product: 1 });
inventoryTransactionSchema.index({ inventory: 1 });
inventoryTransactionSchema.index({ transactionType: 1 });
inventoryTransactionSchema.index({ createdAt: -1 });
inventoryTransactionSchema.index({ reference: 1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
