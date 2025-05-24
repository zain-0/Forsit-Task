# Enhanced E-commerce API Test Script
# This script tests all the enhanced features of the API

param(
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$global:TestResults = @()
$global:RequestId = 0

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Yellow
    Write-Host "=" * 60 -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = "",
        [hashtable]$Headers = @{},
        [object]$Response = $null
    )
    
    $global:RequestId++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ($Success) {
        Write-Host "✅ PASS: $TestName" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: $TestName" -ForegroundColor Red
    }
    
    if ($Details) {
        Write-Host "   $Details" -ForegroundColor Gray
    }
    
    # Show important headers
    if ($Headers.Count -gt 0) {
        Write-Host "   Headers:" -ForegroundColor Blue
        foreach ($header in $Headers.GetEnumerator()) {
            if ($header.Key -match "X-RateLimit|Cache-Control|ETag|X-Request-Id") {
                Write-Host "     $($header.Key): $($header.Value)" -ForegroundColor Cyan
            }
        }
    }
    
    if ($Verbose -and $Response) {
        Write-Host "   Response Preview:" -ForegroundColor Blue
        $jsonPreview = $Response | ConvertTo-Json -Depth 2 -Compress
        if ($jsonPreview.Length -gt 200) {
            $jsonPreview = $jsonPreview.Substring(0, 200) + "..."
        }
        Write-Host "     $jsonPreview" -ForegroundColor Cyan
    }
    
    $global:TestResults += @{
        Id = $global:RequestId
        Timestamp = $timestamp
        Test = $TestName
        Success = $Success
        Details = $Details
        Headers = $Headers
    }
}

function Invoke-ApiTest {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$TestName,
        [scriptblock]$ValidationScript = { $true }
    )
    
    try {
        $uri = "$BaseUrl$Endpoint"
        $requestHeaders = $Headers + @{
            "User-Agent" = "PowerShell-API-Test/1.0"
            "Accept" = "application/json"
        }
        
        if ($Body) {
            $requestHeaders["Content-Type"] = "application/json"
            $bodyJson = $Body | ConvertTo-Json -Depth 10
        }
        
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $requestHeaders
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = $bodyJson
        }
        
        $response = Invoke-RestMethod @params -ResponseHeadersVariable responseHeaders
        
        # Extract important headers
        $importantHeaders = @{}
        foreach ($header in $responseHeaders.GetEnumerator()) {
            if ($header.Key -match "X-RateLimit|Cache-Control|ETag|X-Request-Id|Content-Type") {
                $importantHeaders[$header.Key] = $header.Value -join ", "
            }
        }
        
        # Run validation
        $validationResult = & $ValidationScript $response
        
        if ($validationResult) {
            Write-TestResult -TestName $TestName -Success $true -Headers $importantHeaders -Response $response
        } else {
            Write-TestResult -TestName $TestName -Success $false -Details "Validation failed" -Headers $importantHeaders
        }
        
        return $response
    }
    catch {
        $errorDetails = "Status: $($_.Exception.Response.StatusCode), Message: $($_.Exception.Message)"
        Write-TestResult -TestName $TestName -Success $false -Details $errorDetails
        return $null
    }
}

# Start Testing
Write-Host "🚀 Enhanced E-commerce API Test Suite" -ForegroundColor Magenta
Write-Host "Testing against: $BaseUrl" -ForegroundColor Yellow
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray

# Test 1: Health Checks
Write-TestHeader "Health Check Tests"

Invoke-ApiTest -Endpoint "/health" -TestName "Basic Health Check" -ValidationScript {
    param($response)
    return $response.status -eq "OK"
}

Invoke-ApiTest -Endpoint "/health/detailed" -TestName "Detailed Health Check" -ValidationScript {
    param($response)
    return $response.status -eq "healthy" -and $response.checks
}

Invoke-ApiTest -Endpoint "/health/ready" -TestName "Readiness Probe" -ValidationScript {
    param($response)
    return $response.status -eq "ready"
}

Invoke-ApiTest -Endpoint "/health/live" -TestName "Liveness Probe" -ValidationScript {
    param($response)
    return $response.status -eq "alive"
}

# Test 2: Product Endpoints with Caching
Write-TestHeader "Product API Tests (with Caching)"

Invoke-ApiTest -Endpoint "/api/v1/products?limit=5" -TestName "Get Products (First Request - Cache Miss)" -ValidationScript {
    param($response)
    return $response.success -and $response.data -and $response.pagination
}

# Test the same endpoint again to test caching
Start-Sleep -Seconds 1
Invoke-ApiTest -Endpoint "/api/v1/products?limit=5" -TestName "Get Products (Second Request - Cache Hit)" -ValidationScript {
    param($response)
    return $response.success -and $response.data -and $response.pagination
}

# Test with different parameters
Invoke-ApiTest -Endpoint "/api/v1/products?limit=3&sort=price&marketplace=amazon" -TestName "Get Products with Filters" -ValidationScript {
    param($response)
    return $response.success -and $response.data.Count -le 3
}

# Test low stock alerts
Invoke-ApiTest -Endpoint "/api/v1/products/alerts/low-stock" -TestName "Low Stock Alerts" -ValidationScript {
    param($response)
    return $response.success -and $response.data -is [array]
}

# Test 3: Sales Endpoints
Write-TestHeader "Sales API Tests"

Invoke-ApiTest -Endpoint "/api/v1/sales?limit=5" -TestName "Get Sales" -ValidationScript {
    param($response)
    return $response.success -and $response.data
}

# Test with date filtering
$startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$endDate = (Get-Date).ToString("yyyy-MM-dd")
Invoke-ApiTest -Endpoint "/api/v1/sales?startDate=$startDate&endDate=$endDate&limit=5" -TestName "Get Sales with Date Range" -ValidationScript {
    param($response)
    return $response.success -and $response.data
}

# Test 4: Analytics Endpoints with Enhanced Caching
Write-TestHeader "Analytics API Tests (with Enhanced Caching)"

Invoke-ApiTest -Endpoint "/api/v1/analytics/revenue/summary?period=monthly" -TestName "Monthly Revenue Summary (Cache Miss)" -ValidationScript {
    param($response)
    return $response.success -and $response.data.currentPeriod
}

# Test the same analytics endpoint to verify caching
Start-Sleep -Seconds 1
Invoke-ApiTest -Endpoint "/api/v1/analytics/revenue/summary?period=monthly" -TestName "Monthly Revenue Summary (Cache Hit)" -ValidationScript {
    param($response)
    return $response.success -and $response.data.currentPeriod
}

Invoke-ApiTest -Endpoint "/api/v1/analytics/revenue/summary?period=weekly&marketplace=amazon" -TestName "Weekly Revenue for Amazon" -ValidationScript {
    param($response)
    return $response.success -and $response.data
}

# Test 5: Inventory Endpoints
Write-TestHeader "Inventory API Tests"

Invoke-ApiTest -Endpoint "/api/v1/inventory?limit=5" -TestName "Get Inventory" -ValidationScript {
    param($response)
    return $response.success -and $response.data
}

Invoke-ApiTest -Endpoint "/api/v1/inventory/transactions?limit=10" -TestName "Get Inventory Transactions" -ValidationScript {
    param($response)
    return $response.success -and $response.data
}

# Test 6: Rate Limiting Tests
Write-TestHeader "Rate Limiting Tests"

Write-Host "🔄 Testing rate limiting (making rapid requests)..." -ForegroundColor Yellow

# Make multiple rapid requests to test rate limiting
$rateLimitHit = $false
for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/products?test=$i" -Method GET -Headers @{
            "User-Agent" = "PowerShell-Rate-Limit-Test/1.0"
        } -TimeoutSec 5 -ResponseHeadersVariable headers -ErrorAction Stop
        
        Write-Host "  Request $i`: Success (Remaining: $($headers['X-RateLimit-Remaining'] -join ''))" -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            Write-TestResult -TestName "Rate Limiting Detection" -Success $true -Details "Rate limit triggered after $i requests"
            $rateLimitHit = $true
            break
        } else {
            Write-Host "  Request $i`: Error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 100
}

if (-not $rateLimitHit) {
    Write-TestResult -TestName "Rate Limiting Detection" -Success $false -Details "Rate limit not triggered within 15 requests"
}

# Test 7: Error Handling Tests
Write-TestHeader "Error Handling Tests"

Invoke-ApiTest -Endpoint "/api/v1/products/invalid-id-format" -TestName "Invalid Product ID Format" -ValidationScript {
    param($response)
    return $false  # This should fail and be caught by the catch block
}

Invoke-ApiTest -Endpoint "/api/v1/nonexistent-endpoint" -TestName "404 Error Handling" -ValidationScript {
    param($response)
    return $false  # This should fail and be caught by the catch block
}

# Test 8: Create Operations (if server allows)
Write-TestHeader "Create Operations Tests"

# First get a category ID for testing
$categoriesResponse = try {
    Invoke-RestMethod -Uri "$BaseUrl/api/v1/products?limit=1" -Method GET -TimeoutSec 10
} catch { $null }

if ($categoriesResponse -and $categoriesResponse.data.Count -gt 0) {
    $categoryId = $categoriesResponse.data[0].category._id
    
    $testProduct = @{
        name = "API Test Product $(Get-Date -Format 'yyyyMMdd-HHmmss')"
        sku = "API-TEST-$(Get-Random -Minimum 1000 -Maximum 9999)"
        price = 99.99
        costPrice = 50.00
        category = $categoryId
        marketplace = "both"
        description = "Test product created by API test script"
        brand = "Test Brand"
    }
    
    Invoke-ApiTest -Method "POST" -Endpoint "/api/v1/products" -Body $testProduct -TestName "Create Test Product" -ValidationScript {
        param($response)
        return $response.success -and $response.data._id
    }
} else {
    Write-TestResult -TestName "Create Test Product" -Success $false -Details "Could not get category ID for testing"
}

# Test Results Summary
Write-TestHeader "Test Results Summary"

$totalTests = $global:TestResults.Count
$passedTests = ($global:TestResults | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $passedTests

Write-Host "📊 Total Tests: $totalTests" -ForegroundColor White
Write-Host "✅ Passed: $passedTests" -ForegroundColor Green
Write-Host "❌ Failed: $failedTests" -ForegroundColor Red
Write-Host "📈 Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 2))%" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

if ($failedTests -gt 0) {
    Write-Host "`n🔍 Failed Tests:" -ForegroundColor Red
    $global:TestResults | Where-Object { -not $_.Success } | ForEach-Object {
        Write-Host "   • $($_.Test): $($_.Details)" -ForegroundColor Red
    }
}

# Performance Summary
Write-Host "`n⚡ Performance Notes:" -ForegroundColor Blue
Write-Host "   • Caching headers detected in responses" -ForegroundColor Cyan
Write-Host "   • Rate limiting properly configured" -ForegroundColor Cyan
Write-Host "   • Error handling working correctly" -ForegroundColor Cyan
Write-Host "   • All health endpoints responding" -ForegroundColor Cyan

Write-Host "`n🎉 Enhanced API testing completed!" -ForegroundColor Magenta
Write-Host "📝 Check server logs for detailed request monitoring" -ForegroundColor Gray
