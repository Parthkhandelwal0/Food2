// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true }, // Linking product to a store
  image: { type: String, required: false }, // Optional field to store the image URL
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
