const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  txn_type: {  
    type: String,
    required: true
  },
  qty: {  
    type: Number,
    required: true
  },
  reason: String,
  ref_id: String  
}, {
  timestamps: true
});

// Performance indexes for transaction history queries
inventoryTransactionSchema.index({ product: 1 });
inventoryTransactionSchema.index({ type: 1 }); // Fixed field name from txn_type
inventoryTransactionSchema.index({ createdAt: -1 });
inventoryTransactionSchema.index({ product: 1, createdAt: -1 }); // Product history
inventoryTransactionSchema.index({ type: 1, createdAt: -1 }); // Transaction type filtering

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
