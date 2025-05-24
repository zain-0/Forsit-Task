# E-commerce API Testing Guide

## Overview
This guide provides comprehensive testing information for the enhanced E-commerce Admin API.

## Server Configuration
The API has been enhanced with:
- ✅ Enterprise-grade logging (Winston)
- ✅ Advanced caching system
- ✅ Tiered rate limiting
- ✅ Custom error handling
- ✅ Request/response monitoring
- ✅ Health check endpoints
- ✅ Database connection management

## Environment Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file with:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   CACHE_TTL=300
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Seed Database**
   ```bash
   node seed.js
   ```

4. **Start Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Products
- `GET /api/v1/products` - Get all products (cached 1 min)
- `GET /api/v1/products/:id` - Get product by ID (cached 2 min)
- `GET /api/v1/products/alerts/low-stock` - Low stock alerts (cached 30 sec)
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Sales
- `GET /api/v1/sales` - Get all sales (cached 30 sec)
- `GET /api/v1/sales/:id` - Get sale by ID
- `POST /api/v1/sales` - Create sale
- `PUT /api/v1/sales/:id` - Update sale

### Inventory
- `GET /api/v1/inventory` - Get inventory (cached 1 min)
- `GET /api/v1/inventory/:id` - Get inventory by ID
- `POST /api/v1/inventory/adjust` - Adjust inventory
- `GET /api/v1/inventory/transactions` - Get transactions

### Analytics
- `GET /api/v1/analytics/revenue/summary` - Revenue summary (cached 2 min)
- `GET /api/v1/analytics/sales/trends` - Sales trends
- `GET /api/v1/analytics/products/performance` - Product performance
- `GET /api/v1/analytics/inventory/turnover` - Inventory turnover

## Rate Limiting

### Tiers
1. **Basic Limiter**: 100 requests per 15 minutes (all routes)
2. **Strict Limiter**: 50 requests per 15 minutes (CRUD operations)
3. **Analytics Limiter**: 20 requests per 15 minutes (analytics routes)

### Headers
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

## Caching

### Cache Headers
- `Cache-Control`: Caching directives
- `ETag`: Entity tag for validation
- `Last-Modified`: Last modification time

### Cache Keys
- Products: `products:query_hash`
- Product by ID: `product:product_id`
- Low stock: `low-stock:all`
- Analytics: `revenue-summary:period_marketplace`

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-05-24T02:50:14.380Z",
  "requestId": "req_123456789",
  "error": "Detailed error (development only)"
}
```

### Error Types
- `400` - Validation Error
- `404` - Not Found Error
- `409` - Conflict Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Logging

### Log Levels
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages
- `debug`: Debug messages

### Log Files
- `logs/error.log`: Error logs
- `logs/combined.log`: All logs
- Console output in development

### Log Format
```json
{
  "timestamp": "2025-05-24T02:50:14.380Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "req_123456789",
  "method": "GET",
  "url": "/api/v1/products",
  "statusCode": 200,
  "responseTime": 45
}
```

## Testing Commands

### Basic Health Check
```bash
curl http://localhost:3000/health
```

### Get Products with Caching
```bash
curl -H "Accept: application/json" http://localhost:3000/api/v1/products
```

### Create Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST001",
    "price": 99.99,
    "costPrice": 50.00,
    "category": "category_id_here",
    "marketplace": "both"
  }'
```

### Analytics Revenue Summary
```bash
curl "http://localhost:3000/api/v1/analytics/revenue/summary?period=monthly"
```

## Monitoring

### Key Metrics
- Request count by endpoint
- Response times
- Error rates
- Cache hit rates
- Database connection status
- Memory usage

### Health Dashboard
Access `/health/detailed` for comprehensive system status including:
- Database connectivity
- Memory usage
- Uptime
- Cache statistics
- Error counts

## Performance Features

### Caching Strategy
- Frequently accessed data cached automatically
- Smart cache invalidation
- Multiple cache tiers for different data types
- ETags for client-side caching

### Database Optimization
- Connection pooling
- Query optimization
- Indexes on commonly queried fields
- Aggregation pipelines for analytics

### Request Optimization
- Request/response compression
- Response pagination
- Field selection support
- Batch operations where applicable

## Troubleshooting

### Common Issues
1. **High Memory Usage**: Check cache TTL settings
2. **Slow Responses**: Check database connection and indexes
3. **Rate Limit Errors**: Implement request throttling on client
4. **Cache Misses**: Verify cache configuration and TTL

### Debug Mode
Set `NODE_ENV=development` and `LOG_LEVEL=debug` for detailed logging.

### Performance Monitoring
Monitor the `/health/detailed` endpoint for system metrics and database performance.
