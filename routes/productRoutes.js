// routes/productRoutes.js
const express = require("express");
const Product = require("../models/Product");
const multer = require("multer");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// const authenticateToken = require("../middleware/authenticateToken"); // Assuming you have this middleware
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
    console.log(token);
    return res.status(401).send("Invalid Token");
  }
  return next();
};

// Directory where the uploads will be stored
const uploadDir = path.join(__dirname, "uploads");

// Ensure the upload directory exists
fs.existsSync(uploadDir) || fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use the directory path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
// Add a new product, linked to the authenticated store
router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { name, description, price } = req.body;
    try {
      const imagePath = req.file ? req.file.path : null; // Get the path of the uploaded file
      const product = new Product({
        name,
        description,
        price,
        store: req.store.storeId, // Assuming you attach store ID to req.store in your auth middleware
        image: imagePath,
      });
      await product.save();
      res.status(201).json(product);
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: "Product creation failed" });
    }
  }
);

// Get products for the authenticated store
router.get("/", authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ store: req.store.storeId });
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: "Failed to retrieve products" });
  }
});
// PUT route for updating a store
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, location, phone } = req.body;
  const updateData = {
    name,
    description,
    location,
    phone,
  };

  try {
    const updatedStore = await Store.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedStore) {
      return res.status(404).send("Store not found");
    }
    res.json(updatedStore);
  } catch (error) {
    res.status(400).send("Error updating store");
  }
});

// DELETE route for deleting a product and its image
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Attempt to delete the product image if it exists
    if (product.image) {
      // Construct the absolute path to the image file
      const imagePath = path.join("uploads", product.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete the image file:", err);
        }
      });
    }

    // Delete the product from the database
    await Product.findByIdAndDelete(id);

    res.send("Product successfully deleted");
  } catch (error) {
    res.status(400).send("Error deleting product");
  }
});

// Get products for a store
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ store: id });
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: "Failed to retrieve products" });
  }
});

module.exports = router;
