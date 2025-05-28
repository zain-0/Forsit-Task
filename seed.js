// AI-Generated SEED file
const mongoose = require('mongoose');
const moment = require('moment');
require('dotenv').config();

// Import models
const Category = require('./models/Category');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const Sale = require('./models/Sale');
const InventoryTransaction = require('./models/InventoryTransaction');

// Sample data
const categories = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Home & Kitchen', description: 'Home appliances and kitchen items' },
  { name: 'Clothing', description: 'Apparel and fashion items' },
  { name: 'Books', description: 'Books and publications' },
  { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
  { name: 'Health & Beauty', description: 'Health and beauty products' },
  { name: 'Toys & Games', description: 'Toys and gaming products' },
  { name: 'Automotive', description: 'Car parts and automotive accessories' }
];

const sampleProducts = [
  // Electronics
  { name: 'iPhone 15 Pro', brand: 'Apple', price: 999, cost_price: 650, category: 'Electronics', marketplace: 'both' },
  { name: 'Samsung Galaxy S24', brand: 'Samsung', price: 899, cost_price: 600, category: 'Electronics', marketplace: 'amazon' },
  { name: 'AirPods Pro', brand: 'Apple', price: 249, cost_price: 150, category: 'Electronics', marketplace: 'both' },
  { name: 'Sony WH-1000XM5', brand: 'Sony', price: 349, cost_price: 200, category: 'Electronics', marketplace: 'walmart' },
  { name: 'MacBook Air M3', brand: 'Apple', price: 1199, cost_price: 800, category: 'Electronics', marketplace: 'amazon' },

  // Home & Kitchen
  { name: 'Instant Pot Duo 7-in-1', brand: 'Instant Pot', price: 89, cost_price: 45, category: 'Home & Kitchen', marketplace: 'both' },
  { name: 'KitchenAid Stand Mixer', brand: 'KitchenAid', price: 449, cost_price: 250, category: 'Home & Kitchen', marketplace: 'walmart' },
  { name: 'Dyson V15 Detect', brand: 'Dyson', price: 649, cost_price: 400, category: 'Home & Kitchen', marketplace: 'amazon' },
  { name: 'Ninja Foodi Air Fryer', brand: 'Ninja', price: 199, cost_price: 100, category: 'Home & Kitchen', marketplace: 'both' },
  { name: 'Roomba i7+', brand: 'iRobot', price: 799, cost_price: 450, category: 'Home & Kitchen', marketplace: 'amazon' },

  // Clothing
  { name: 'Levi\'s 501 Jeans', brand: 'Levi\'s', price: 69, cost_price: 35, category: 'Clothing', marketplace: 'both' },
  { name: 'Nike Air Force 1', brand: 'Nike', price: 110, cost_price: 60, category: 'Clothing', marketplace: 'walmart' },
  { name: 'Adidas Ultraboost 22', brand: 'Adidas', price: 180, cost_price: 90, category: 'Clothing', marketplace: 'amazon' },
  { name: 'Champion Hoodie', brand: 'Champion', price: 45, cost_price: 20, category: 'Clothing', marketplace: 'both' },
  { name: 'Ray-Ban Aviators', brand: 'Ray-Ban', price: 154, cost_price: 80, category: 'Clothing', marketplace: 'amazon' },

  // Books
  { name: 'Atomic Habits', brand: 'Clear', price: 18, cost_price: 8, category: 'Books', marketplace: 'both' },
  { name: 'The 7 Habits of Highly Effective People', brand: 'Covey', price: 16, cost_price: 7, category: 'Books', marketplace: 'amazon' },
  { name: 'Think and Grow Rich', brand: 'Hill', price: 14, cost_price: 6, category: 'Books', marketplace: 'walmart' },

  // Sports & Outdoors  { name: 'YETI Rambler Tumbler', brand: 'YETI', price: 35, cost_price: 18, category: 'Sports & Outdoors', marketplace: 'both' },
  { name: 'Coleman 6-Person Tent', brand: 'Coleman', price: 159, cost_price: 80, category: 'Sports & Outdoors', marketplace: 'walmart' },
  { name: 'Hydro Flask Water Bottle', brand: 'Hydro Flask', price: 44, cost_price: 22, category: 'Sports & Outdoors', marketplace: 'amazon' },

  // Health & Beauty
  { name: 'Olay Regenerist Cream', brand: 'Olay', price: 28, cost_price: 12, category: 'Health & Beauty', marketplace: 'both' },
  { name: 'Philips Sonicare Toothbrush', brand: 'Philips', price: 199, cost_price: 100, category: 'Health & Beauty', marketplace: 'amazon' },
  { name: 'CeraVe Moisturizing Cream', brand: 'CeraVe', price: 19, cost_price: 8, category: 'Health & Beauty', marketplace: 'walmart' },

  // Toys & Games
  { name: 'LEGO Creator Expert Set', brand: 'LEGO', price: 199, cost_price: 120, category: 'Toys & Games', marketplace: 'both' },
  { name: 'Nintendo Switch OLED', brand: 'Nintendo', price: 349, cost_price: 250, category: 'Toys & Games', marketplace: 'amazon' },
  { name: 'Monopoly Board Game', brand: 'Hasbro', price: 24, cost_price: 12, category: 'Toys & Games', marketplace: 'walmart' },

  // Automotive
  { name: 'Michelin Wiper Blades', brand: 'Michelin', price: 39, cost_price: 18, category: 'Automotive', marketplace: 'both' },
  { name: 'Mobil 1 Synthetic Oil', brand: 'Mobil 1', price: 49, cost_price: 25, category: 'Automotive', marketplace: 'walmart' },
  { name: 'Chemical Guys Car Wash Kit', brand: 'Chemical Guys', price: 89, cost_price: 45, category: 'Automotive', marketplace: 'amazon' }
];

async function generateSKU(productName, brand) {
  const prefix = brand.substring(0, 3).toUpperCase();
  const suffix = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${suffix}-${random}`;
}

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Inventory.deleteMany({}),
      Sale.deleteMany({}),
      InventoryTransaction.deleteMany({})
    ]);
    console.log('Data cleared');

    // Create categories
    console.log('Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create category map for easy lookup
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });    // Create products
    console.log('Creating products...');
    const productsToCreate = [];
    for (const productData of sampleProducts) {
      const sku = await generateSKU(productData.name, productData.brand);
      productsToCreate.push({
        ...productData,
        sku,
        category: categoryMap[productData.category],
        description: `${productData.name} from ${productData.brand}`
      });
    }

    const createdProducts = await Product.insertMany(productsToCreate);
    console.log(`Created ${createdProducts.length} products`);

    // Create inventory records
    console.log('Creating inventory...');
    const inventoryRecords = [];

    for (const product of createdProducts) {
      const currentStock = Math.floor(Math.random() * 200) + 10;
      const reservedStock = Math.floor(Math.random() * 10);
      inventoryRecords.push({
        product: product._id,
        currentStock,
        reservedStock, location: {
          warehouse: ['Main Warehouse', 'North Warehouse', 'South Warehouse'][Math.floor(Math.random() * 3)],
          shelf: `S${Math.floor(Math.random() * 20) + 1}`
        },
        lastRestocked: moment().subtract(Math.floor(Math.random() * 30), 'days').toDate(),
        cost_per_unit: product.cost_price
      });
    }

    const createdInventory = await Inventory.insertMany(inventoryRecords);
    console.log(`Created ${createdInventory.length} inventory records`);

    // Generate sales data for the last 6 months
    console.log('Generating sales data...');
    const salesData = [];
    const customers = [
      { name: 'John Doe', email: 'john@email.com', location: { city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' } },
      { name: 'Jane Smith', email: 'jane@email.com', location: { city: 'Los Angeles', state: 'CA', country: 'USA', zipCode: '90210' } },
      { name: 'Bob Johnson', email: 'bob@email.com', location: { city: 'Chicago', state: 'IL', country: 'USA', zipCode: '60601' } },
      { name: 'Alice Brown', email: 'alice@email.com', location: { city: 'Houston', state: 'TX', country: 'USA', zipCode: '77001' } },
      { name: 'Charlie Wilson', email: 'charlie@email.com', location: { city: 'Phoenix', state: 'AZ', country: 'USA', zipCode: '85001' } }
    ];

    const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
    const orderStatuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing']; // Most orders delivered

    // Generate sales for each day in the last 6 months
    const startDate = moment().subtract(6, 'months');
    const endDate = moment();

    let orderCounter = 1000;

    for (let date = startDate.clone(); date.isBefore(endDate); date.add(1, 'day')) {
      // Generate 2-15 sales per day (more on weekends)
      const isWeekend = date.day() === 0 || date.day() === 6;
      const salesPerDay = Math.floor(Math.random() * (isWeekend ? 20 : 15)) + 2;

      for (let i = 0; i < salesPerDay; i++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = product.price;
        const totalAmount = quantity * unitPrice;
        const discount = Math.random() < 0.3 ? Math.floor(Math.random() * 50) : 0; // 30% chance of discount
        const tax = totalAmount * 0.08; // 8% tax
        const finalAmount = totalAmount - discount + tax;

        const saleDate = date.clone()
          .add(Math.floor(Math.random() * 24), 'hours')
          .add(Math.floor(Math.random() * 60), 'minutes')
          .toDate(); salesData.push({
            orderId: `ORD-${orderCounter++}`,
            product: product._id,
            quantity,
            originalPrice: unitPrice,
            finalAmount,
            marketplace: product.marketplace === 'both' ?
              ['amazon', 'walmart'][Math.floor(Math.random() * 2)] :
              product.marketplace,
            saleDate,
            fees: {
              marketplace: finalAmount * 0.15, // 15% marketplace fee
              payment: finalAmount * 0.03, // 3% payment processing
              shipping: Math.floor(Math.random() * 10) + 5 // $5-15 shipping
            }
          });
      }
    }

    // Insert sales in batches to avoid memory issues
    const batchSize = 1000;
    let totalSales = 0;
    for (let i = 0; i < salesData.length; i += batchSize) {
      const batch = salesData.slice(i, i + batchSize);
      await Sale.insertMany(batch);
      totalSales += batch.length;
      console.log(`Created ${totalSales}/${salesData.length} sales...`);
    }

    console.log(`Created ${totalSales} sales records`);

    // Create some inventory transactions
    console.log('Creating inventory transactions...');
    const transactions = [];
    for (const inventory of createdInventory.slice(0, 20)) { // Create transactions for first 20 products
      // Inbound transaction (stock received)      
      const inboundQty = Math.floor(Math.random() * 100) + 50;
      transactions.push({
        product: inventory.product,
        txn_type: 'inbound',
        qty: inboundQty,
        reason: 'Initial stock received',
        ref_id: `PO-${Math.floor(Math.random() * 10000)}`
      });

      // Some outbound transactions (sales)
      const outboundTransactions = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < outboundTransactions; i++) {
        const outboundQty = Math.floor(Math.random() * 10) + 1;
        transactions.push({
          product: inventory.product,
          txn_type: 'outbound',
          qty: outboundQty,
          reason: 'Sale fulfillment',
          ref_id: `ORD-${Math.floor(Math.random() * 10000)}`
        });
      }
    } await InventoryTransaction.insertMany(transactions);
    console.log(`Created ${transactions.length} inventory transactions`);

    // Update some products to have low stock for testing alerts
    console.log('Setting up low stock alerts...');
    const productsToUpdate = createdProducts.slice(0, 5);

    for (const product of productsToUpdate) {
      await Inventory.updateOne(
        { product: product._id },
        {
          currentStock: Math.floor(Math.random() * 5) + 1, // Very low stock
          reservedStock: 0
        }
      );
    }
    console.log(`Set up low stock for ${productsToUpdate.length} products`);

    console.log('\nDatabase seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Products: ${createdProducts.length}`);
    console.log(`   Inventory Records: ${createdInventory.length}`);
    console.log(`   Sales: ${totalSales}`);
    console.log(`   Inventory Transactions: ${transactions.length}`);
    console.log(`   Low Stock Alerts: ${productsToUpdate.length}`);

    console.log('\nYou can now start the server with: npm run dev');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
