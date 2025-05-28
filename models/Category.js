const mongoose = require('mongoose');

// simple category model - kept it basic
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }
}, {
  timestamps: true
});

categorySchema.index({ parentCategory: 1 });

module.exports = mongoose.model('Category', categorySchema);
