// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Pre-save hook to hash password before saving the use

const CoordinatesSchema = new mongoose.Schema({
  longitude: { type: Number, required: true },
  latitude: { type: Number, required: true },
});

const StoreSchema = new mongoose.Schema({
  image: { type: String }, // An array to store multiple image URLs
  totalRevenue: { type: Number, default: 0 }, // New field for total money made
  uniqueCustomers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track unique customer IDs
  email: { type: String, required: true, unique: true },
  totalProductsSold: { type: Number, default: 0 },
  password: { type: String, required: true },
  name: { type: String, required: true },
  coordinates: { type: CoordinatesSchema }, // Add this line
  location: { type: String, required: true },
  phone: { type: String, required: true },
  workingDays: { type: String, required: true },
  workingHrs: { type: String, required: true },
});

const Store = mongoose.model("Store", StoreSchema);
module.exports = Store;
