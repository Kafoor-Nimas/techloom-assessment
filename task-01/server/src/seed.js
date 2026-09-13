require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const demoProducts = [
  { name: "Espresso Beans (1kg)", price: 18.5, stock: 25, category: "beverages" },
  { name: "Oat Milk (1L)", price: 3.75, stock: 40, category: "beverages" },
  { name: "Ceramic Mug", price: 9.99, stock: 3, category: "merch" }, // low stock, good for concurrency testing
  { name: "Pastry Box (6pc)", price: 14.0, stock: 12, category: "food" },
  { name: "Gift Card $25", price: 25.0, stock: 100, category: "gift" },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(demoProducts);
  console.log(`Seeded ${demoProducts.length} products.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
