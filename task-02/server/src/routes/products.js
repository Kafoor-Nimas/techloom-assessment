const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// GET /api/products?search=&category=&minPrice=&maxPrice=&inStock=true
router.get("/", async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, inStock } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (inStock === "true") filter.stock = { $gt: 0 };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, price, stock, description, category, imageUrl } = req.body;
    if (!name || price == null || stock == null) {
      return res.status(400).json({ error: "name, price and stock are required" });
    }
    const product = await Product.create({ name, price, stock, description, category, imageUrl });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, price, stock, description, category, imageUrl } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { name, price, stock, description, category, imageUrl } },
      { new: true, runValidators: true, omitUndefined: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
