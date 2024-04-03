// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Pre-save hook to hash password before saving the use

const UserSchema = new mongoose.Schema({
  image: { type: String }, // An array to store multiple image URLs
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String },
  phone: { type: String, required: true },
});

// Pre-save hook to hash password before saving the store
// StoreSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 8);
//   next();
// });

const User = mongoose.model("User", UserSchema);
module.exports = User;
