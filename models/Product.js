// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: false },
  old_price: { type: Number }, // Optional since it may not always be greater than the price
  serving_size: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
  total_fat: { type: Number, default: 0 },
  saturated_fat: { type: Number, default: 0 },
  total_sugars: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  images: [{ type: String }], // An array to store multiple image URLs
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  // Removed the 'description' field as it's not mentioned in your new data structure
  // Consider re-adding it if necessary
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
