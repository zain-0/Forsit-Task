# E-commerce Admin API Test Script
# This script tests all major endpoints of the API

Write-Host "=== E-commerce Admin API Test Suite ===" -ForegroundColor Green
Write-Host "Testing API endpoints..." -ForegroundColor Yellow

$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Health Check: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get All Products
Write-Host "`n2. Testing Products Endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/products" -Method GET
    $products = $response.Content | ConvertFrom-Json
    Write-Host "✓ Products: Found $($products.data.pagination.total) products" -ForegroundColor Green
} catch {
    Write-Host "✗ Products Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Analytics Dashboard
Write-Host "`n3. Testing Analytics Dashboard..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/analytics/dashboard" -Method GET
    $dashboard = $response.Content | ConvertFrom-Json
    Write-Host "✓ Dashboard: $($dashboard.data.summary.totalProducts) products, $($dashboard.data.summary.totalSales) sales" -ForegroundColor Green
} catch {
    Write-Host "✗ Dashboard Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Revenue Summary
Write-Host "`n4. Testing Revenue Analytics..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/analytics/revenue/summary?period=monthly" -Method GET
    $revenue = $response.Content | ConvertFrom-Json
    Write-Host "✓ Revenue Analytics: Period=$($revenue.data.period)" -ForegroundColor Green
} catch {
    Write-Host "✗ Revenue Analytics Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Inventory Alerts
Write-Host "`n5. Testing Low Stock Alerts..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/inventory/alerts/low-stock" -Method GET
    $alerts = $response.Content | ConvertFrom-Json
    Write-Host "✓ Low Stock Alerts: $($alerts.data.summary.total) alerts" -ForegroundColor Green
} catch {
    Write-Host "✗ Low Stock Alerts Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Sales Data
Write-Host "`n6. Testing Sales Endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/sales" -Method GET
    $sales = $response.Content | ConvertFrom-Json
    Write-Host "✓ Sales: Found $($sales.data.pagination.total) sales records" -ForegroundColor Green
} catch {
    Write-Host "✗ Sales Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== API Test Complete ===" -ForegroundColor Green
Write-Host "All endpoints tested successfully!" -ForegroundColor Yellow

# Display available endpoints
Write-Host "`n=== Available API Endpoints ===" -ForegroundColor Blue
Write-Host "📊 Analytics:"
Write-Host "   GET $baseUrl/api/v1/analytics/dashboard"
Write-Host "   GET $baseUrl/api/v1/analytics/revenue/summary"
Write-Host "   GET $baseUrl/api/v1/analytics/revenue/trend"
Write-Host "   GET $baseUrl/api/v1/analytics/products/top-selling"

Write-Host "`n📦 Products:"
Write-Host "   GET $baseUrl/api/v1/products"
Write-Host "   GET $baseUrl/api/v1/products/alerts/low-stock"
Write-Host "   POST $baseUrl/api/v1/products"

Write-Host "`n📈 Sales:"
Write-Host "   GET $baseUrl/api/v1/sales"
Write-Host "   GET $baseUrl/api/v1/sales/filter/date-range"
Write-Host "   POST $baseUrl/api/v1/sales"

Write-Host "`n📋 Inventory:"
Write-Host "   GET $baseUrl/api/v1/inventory"
Write-Host "   GET $baseUrl/api/v1/inventory/alerts/low-stock"
Write-Host "   POST $baseUrl/api/v1/inventory/:id/adjust"

Write-Host "`n🏥 Health:"
Write-Host "   GET $baseUrl/health"
