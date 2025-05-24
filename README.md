# E-commerce Admin API

A comprehensive RESTful API built with Node.js, Express.js, and MongoDB Atlas for managing e-commerce operations including sales analytics, inventory management, and product administration.

## 🚀 Features

### Core Features
- **Sales Analytics**: Comprehensive sales data analysis with period-based reporting
- **Inventory Management**: Real-time inventory tracking with low-stock alerts
- **Product Management**: Full CRUD operations for products and categories
- **Revenue Analysis**: Daily, weekly, monthly, and yearly revenue reports
- **Performance Analytics**: Top-selling products, marketplace comparisons, and profit tracking

### Technical Features
- RESTful API design following best practices
- MongoDB Atlas integration with optimized indexing
- Input validation with Joi
- Error handling and logging
- Rate limiting and security middleware
- Pagination and filtering support
- Demo data seeding script

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Development**: Nodemon

## 📊 Database Schema

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

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecommerce-admin-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# MongoDB Atlas Connection
MONGODB_URIretryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=your-super-secret-jwt-key-here
```

4. **Seed the Database**
```bash
npm run seed
```

5. **Start the Server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Products Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | Get all products with filtering |
| GET | `/api/v1/products/:id` | Get product by ID |
| POST | `/api/v1/products` | Create new product |
| PUT | `/api/v1/products/:id` | Update product |
| DELETE | `/api/v1/products/:id` | Soft delete product |
| GET | `/api/v1/products/alerts/low-stock` | Get low stock products |

### Sales Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sales` | Get all sales with filtering |
| GET | `/api/v1/sales/:id` | Get sale by ID |
| GET | `/api/v1/sales/filter/date-range` | Get sales by date range |
| GET | `/api/v1/sales/filter/product/:productId` | Get sales by product |
| GET | `/api/v1/sales/filter/category/:categoryId` | Get sales by category |

### Inventory Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory` | Get all inventory records |
| GET | `/api/v1/inventory/:id` | Get inventory by ID |
| PUT | `/api/v1/inventory/:id` | Update inventory |
| GET | `/api/v1/inventory/alerts/low-stock` | Get low stock alerts |
| GET | `/api/v1/inventory/transactions/:inventoryId` | Get transaction history |
| POST | `/api/v1/inventory/:id/adjust` | Adjust inventory stock |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/revenue/summary` | Revenue summary by period |
| GET | `/api/v1/analytics/revenue/trend` | Revenue trend data |
| GET | `/api/v1/analytics/revenue/by-marketplace` | Revenue by marketplace |
| GET | `/api/v1/analytics/revenue/by-category` | Revenue by category |
| GET | `/api/v1/analytics/products/top-selling` | Top selling products |
| GET | `/api/v1/analytics/dashboard` | Dashboard overview |

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

## 📈 Sample API Usage

### Get Revenue Summary
```bash
GET /api/v1/analytics/revenue/summary?period=monthly&marketplace=amazon
```

### Get Low Stock Alerts
```bash
GET /api/v1/inventory/alerts/low-stock
```

### Create New Product
```bash
POST /api/v1/products
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "sku": "APL-IPHONE15-001",
  "brand": "Apple",
  "price": 999,
  "costPrice": 650,
  "category": "categoryId",
  "marketplace": "both",
  "description": "Latest iPhone model"
}
```

### Get Sales by Date Range
```bash
GET /api/v1/sales/filter/date-range?startDate=2024-01-01&endDate=2024-12-31&marketplace=amazon
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Joi schema validation
- **Error Handling**: Comprehensive error responses

## 🧪 Demo Data

The application includes a comprehensive seeding script that creates:
- 8 product categories
- 30+ sample products from various brands
- 6 months of sales history (thousands of records)
- Inventory records with realistic stock levels
- Low stock alerts for testing
- Inventory transaction history

Popular brands included: Apple, Samsung, Nike, Adidas, LEGO, Nintendo, and more.

## 📦 Response Format

All API responses follow a consistent format:

### Success Response
```javascript
{
  "success": true,
  "message": "Success",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```javascript
{
  "success": true,
  "message": "Success",
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error message",
  "errors": [ /* detailed errors */ ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Performance Optimizations

- **Database Indexing**: Strategic indexes for common queries
- **Aggregation Pipeline**: Efficient data aggregation for analytics
- **Pagination**: Limit data transfer and improve response times
- **Caching Headers**: Appropriate cache strategies
- **Compression**: Gzip compression for responses

## 🔧 Development

### Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with auto-reload
- `npm run seed`: Populate database with demo data

### Environment Variables
- `NODE_ENV`: Environment mode
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `API_VERSION`: API version prefix

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For questions and support, please contact the development team or create an issue in the repository.

## ✅ Current Status - FULLY FUNCTIONAL

**🎉 The E-commerce Admin API is now completely operational!**

### ✅ Completed Features:
- **✅ Server**: Running successfully on port 3000
- **✅ Database**: Connected to MongoDB Atlas with demo data populated
- **✅ API Endpoints**: All 20+ endpoints tested and functional
- **✅ Security**: Helmet, CORS, and rate limiting enabled
- **✅ Error Handling**: Comprehensive error responses implemented
- **✅ Validation**: Input validation with Joi on all endpoints
- **✅ Analytics**: Revenue reports, dashboard, and trend analysis working
- **✅ Inventory**: Stock management and low-stock alerts functional
- **✅ Products**: Full CRUD operations with filtering and search
- **✅ Sales**: Transaction tracking and filtering by various criteria
- **✅ Documentation**: Complete API documentation provided

### 🧪 Test Results:
All endpoints have been tested and verified:
- Health check: ✅ Working
- Products API: ✅ 30 products loaded
- Analytics dashboard: ✅ Functional
- Low stock alerts: ✅ Working
- Sales data: ✅ Accessible
- Inventory management: ✅ Operational

### 🚀 Ready for Use:
The API is production-ready with:
- MongoDB Atlas database connection
- Comprehensive demo data (6+ months of sales history)
- Secure middleware stack
- RESTful design principles
- Optimized database queries and indexing

**🌐 Access the API:**
- Health Check: http://localhost:3000/health
- Products: http://localhost:3000/api/v1/products  
- Dashboard: http://localhost:3000/api/v1/analytics/dashboard
- Complete API documentation below ⬇️
