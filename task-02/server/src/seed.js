require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const demoProducts = [
  { name: "Wireless Mouse", price: 24.99, stock: 30, category: "electronics", description: "Ergonomic 2.4GHz wireless mouse." },
  { name: "Mechanical Keyboard", price: 79.0, stock: 15, category: "electronics", description: "Hot-swappable mechanical keyboard." },
  { name: "USB-C Hub", price: 34.5, stock: 2, category: "electronics", description: "7-in-1 USB-C hub with HDMI." },
  { name: "Canvas Tote Bag", price: 18.0, stock: 50, category: "accessories", description: "Heavy-duty canvas tote." },
  { name: "Ceramic Plant Pot", price: 12.5, stock: 20, category: "home", description: "Minimalist ceramic pot, 6 inch." },
  { name: "Scented Candle", price: 15.75, stock: 0, category: "home", description: "Soy wax candle, sandalwood scent." },
  { name: "Notebook Set (3pk)", price: 9.99, stock: 60, category: "stationery", description: "Dot-grid notebooks, A5." },
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
