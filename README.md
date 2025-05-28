# E-commerce Admin API

### Core Features

- **Sales Analytics**: Comprehensive sales data analysis with period-based reporting
- **Inventory Management**: Real-time inventory tracking with low-stock alerts
- **Product Management**: Full CRUD operations for products and categories
- **Revenue Analysis**: Daily, weekly, monthly, and yearly revenue reports
- **Performance Analytics**: Top-selling products, marketplace comparisons, and profit tracking

## Database Schema

### Collections Overview

#### Products Collection

Stores product information including pricing, categories, and marketplace data.

```javascript
{
  name: String,           // Product name
  sku: String,           // Unique stock keeping unit
  description: String,    // Product description
  category: ObjectId,     // Reference to Category
  brand: String,          // Product brand
  price: Number,          // Selling price
  costPrice: Number,      // Cost price for profit calculation
  marketplace: String,    // 'amazon', 'walmart', or 'both'
  status: String,         // 'active', 'inactive', 'discontinued'
  lowStockThreshold: Number,
  images: [Object],       // Product images
  tags: [String]          // Product tags
}
```

#### Categories Collection

Hierarchical product categorization system.

```javascript
{
  name: String,           // Category name
  description: String,    // Category description
  parentCategory: ObjectId, // For nested categories
  isActive: Boolean       // Category status
}
```

#### Inventory Collection

Real-time inventory tracking and management.

```javascript
{
  product: ObjectId,      // Reference to Product
  currentStock: Number,   // Available quantity
  reservedStock: Number,  // Reserved for pending orders
  reorderPoint: Number,   // Low stock threshold
  reorderQuantity: Number, // Suggested reorder amount
  location: {             // Warehouse location
    warehouse: String,
    shelf: String,
    bin: String
  },
  supplier: Object,       // Supplier information
  lastRestocked: Date,    // Last restock date
  costPerUnit: Number     // Unit cost
}
```

#### Sales Collection

Comprehensive sales transaction records.

```javascript
{
  orderId: String,        // Unique order identifier
  product: ObjectId,      // Reference to Product
  quantity: Number,       // Quantity sold
  unitPrice: Number,      // Price per unit
  totalAmount: Number,    // Subtotal
  discount: Number,       // Discount applied
  tax: Number,           // Tax amount
  finalAmount: Number,    // Final amount after discount/tax
  marketplace: String,    // 'amazon' or 'walmart'
  customer: Object,       // Customer information
  paymentMethod: String,  // Payment method used
  paymentStatus: String,  // Payment status
  orderStatus: String,    // Order fulfillment status
  saleDate: Date,        // Transaction date
  shippingInfo: Object   // Shipping details
}
```

#### InventoryTransaction Collection

Audit trail for inventory changes.

```javascript
{
  product: ObjectId,      // Reference to Product
  inventory: ObjectId,    // Reference to Inventory
  transactionType: String, // 'inbound', 'outbound', 'adjustment'
  quantity: Number,       // Quantity changed
  previousStock: Number,  // Stock before transaction
  newStock: Number,       // Stock after transaction
  reason: String,         // Reason for transaction
  performedBy: Object     // User who performed transaction
}
```

### Database Relationships

1. **Products ↔ Categories**: Many-to-One relationship
2. **Products ↔ Inventory**: One-to-One relationship
3. **Products ↔ Sales**: One-to-Many relationship
4. **Inventory ↔ InventoryTransaction**: One-to-Many relationship

### Indexing Strategy

Optimized indexes for high-performance queries:

- **Products**: sku, category, marketplace, status, name (text search)
- **Sales**: saleDate, marketplace, product, orderStatus
- **Inventory**: product, location.warehouse, currentStock
- **Categories**: name, parentCategory, isActive

## Setup Instructions

### Installation

1. **Install Dependencies**

```
npm install
```

3. **Environment Configuration**
   Create a `.env` file in the root directory, from the .env.sample given
4. **Seed the Database**

```bash
npm run seed
```

5. **Start the Server**

```
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Products Endpoints

| Method | Endpoint                            | Description                     |
| ------ | ----------------------------------- | ------------------------------- |
| GET    | `/api/v1/products`                  | Get all products with filtering |
| GET    | `/api/v1/products/:id`              | Get product by ID               |
| POST   | `/api/v1/products`                  | Create new product              |
| PUT    | `/api/v1/products/:id`              | Update product                  |
| DELETE | `/api/v1/products/:id`              | Soft delete product             |
| GET    | `/api/v1/products/alerts/low-stock` | Get low stock products          |

### Sales Endpoints

| Method | Endpoint                         | Description                                     |
| ------ | -------------------------------- | ----------------------------------------------- |
| GET    | `/api/v1/sales`                  | Get all sales with filtering                    |
| GET    | `/api/v1/sales/:id`              | Get sale by ID                                  |
| GET    | `/api/v1/sales/filter`           | Advanced sales filtering with multiple criteria |
| GET    | `/api/v1/sales/:id/financials`   | Get sale financial details                      |
| GET    | `/api/v1/sales/summary/overview` | Sales summary overview                          |
| GET    | `/api/v1/sales/recent/latest`    | Get recent sales                                |
| POST   | `/api/v1/sales`                  | Create new sale                                 |
| PUT    | `/api/v1/sales/:id`              | Update sale                                     |
| DELETE | `/api/v1/sales/:id`              | Delete sale                                     |

### Inventory Endpoints

| Method | Endpoint                               | Description                           |
| ------ | -------------------------------------- | ------------------------------------- |
| GET    | `/api/v1/inventory`                    | Get all inventory records             |
| GET    | `/api/v1/inventory/product/:productId` | Get inventory by product              |
| GET    | `/api/v1/inventory/:id/status`         | Get inventory status                  |
| GET    | `/api/v1/inventory/alerts/low-stock`   | Get low stock alerts                  |
| GET    | `/api/v1/inventory/:id/transactions`   | Get inventory transaction history     |
| GET    | `/api/v1/inventory/history/:productId` | Get inventory history for product     |
| PUT    | `/api/v1/inventory/:id/stock`          | Update inventory stock                |
| PUT    | `/api/v1/inventory/:id/levels`         | Update inventory levels with tracking |
| POST   | `/api/v1/inventory/bulk-update`        | Bulk inventory updates                |

### Analytics Endpoints

| Method | Endpoint                                 | Description                         |
| ------ | ---------------------------------------- | ----------------------------------- |
| GET    | `/api/v1/analytics/revenue/summary`      | Revenue summary by period           |
| GET    | `/api/v1/analytics/revenue/trends`       | Revenue trend data                  |
| GET    | `/api/v1/analytics/products/top-selling` | Top selling products                |
| GET    | `/api/v1/analytics/revenue/daily`        | Daily revenue analytics             |
| GET    | `/api/v1/analytics/revenue/weekly`       | Weekly revenue analytics            |
| GET    | `/api/v1/analytics/revenue/monthly`      | Monthly revenue analytics           |
| GET    | `/api/v1/analytics/revenue/annual`       | Annual revenue analytics            |
| GET    | `/api/v1/analytics/revenue/comparison`   | Period-to-period revenue comparison |

### Query Parameters

#### Common Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (prefix with - for descending)
- `search`: Text search query

#### Date Range Parameters

- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)
- `period`: Predefined period ('daily', 'weekly', 'monthly', 'yearly')

#### Filter Parameters

- `marketplace`: Filter by marketplace ('amazon', 'walmart', 'both')
- `category`: Filter by category ID
- `status`: Filter by status
- `minPrice`/`maxPrice`: Price range filter
- `brand`: Filter by product brand
- `minAmount`/`maxAmount`: Amount range filter for sales

#### Analytics Parameters

- `days`: Number of days for daily analytics (default: 30)
- `weeks`: Number of weeks for weekly analytics (default: 12)
- `months`: Number of months for monthly analytics (default: 12)
- `years`: Number of years for annual analytics (default: 3)
- `currentPeriod`/`previousPeriod`: Period types for comparison ('day', 'week', 'month', 'year')

## Demo Data

AI Generated script to seed the db with sample data. Use `npm run seed` to seed the data
