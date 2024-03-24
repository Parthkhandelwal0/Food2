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
  email: { type: String, required: true, unique: true },
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
