const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Store = require("../models/Store");
require("dotenv").config();
const Product = require("../models/Product");

const router = express.Router();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token)
    return res.status(403).send("A token is required for authentication");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.store = decoded;
  } catch (err) {
    console.log("token failed");
    console.log(token);
    return res.status(401).send("Invalid Token");
  }
  return next();
};

router.patch("/coordinates", authenticateToken, async (req, res) => {
  const storeId = req.store.storeId;
  const { longitude, latitude } = req.body;

  if (!longitude || !latitude) {
    return res
      .status(400)
      .json({ message: "Longitude and latitude are required." });
  }

  try {
    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({ message: "Store not found." });
    }

    // Update the store's coordinates
    store.coordinates = { longitude, latitude };
    await store.save();

    res.json({
      success: true,
      message: "Coordinates updated successfully.",
      data: {
        longitude: store.coordinates.longitude,
        latitude: store.coordinates.latitude,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update coordinates." });
  }
});

router.get("/", async (req, res) => {
  try {
    const stores = await Store.find({}); // Find all stores
    const formattedStores = stores.map((store) => ({
      title: store.name,
      image: store.image,
      // quantity: store.quantity,
      // Map any additional fields as needed
    }));

    res.json({ success: true, data: formattedStores, message: "Stores sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching stores" });
  }
});

// Update store information
router.put("/update", authenticateToken, async (req, res) => {
  console.log(req.body);

  const { id, email, name, location, phone, workingHrs, workingDays } =
    req.body;

  try {
    let store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Check if the requester is the store owner
    if (req.store.storeId !== store._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only update your own store" });
    }

    // Update fields
    if (email) store.email = email;
    if (name) store.name = name;
    if (location) store.location = location;
    if (phone) store.phone = phone;
    if (workingDays) store.workingDays = workingDays;
    if (workingHrs) store.workingHrs = workingHrs;

    // Handle password change with hashing
    // if (password) {
    //   store.password = await bcrypt.hash(password, 10);
    // }

    await store.save(); // Save the updated store information
    res.json({
      success: true,
      message: "Store updated successfully",
      data: store,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating store", error: error.message });
  }
});

module.exports = router;
