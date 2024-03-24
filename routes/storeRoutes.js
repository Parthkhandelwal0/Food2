const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Store = require("../models/Store");
require("dotenv").config();
const Product = require("../models/Product");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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
// router.put(
//   "/update",
//   authenticateToken,
//   upload.single("photo"),
//   async (req, res) => {
//     console.log(req.body);
//     const storeId = req.store.storeId;

//     const { email, name, location, phone, workingHrs, workingDays } = req.body;

//     try {
//       let store = await Store.findById(storeId);
//       if (!store) {
//         return res.status(404).json({ message: "Store not found" });
//       }

//       // Check if the requester is the store owner
//       if (req.store.storeId !== store._id.toString()) {
//         return res
//           .status(403)
//           .json({ message: "You can only update your own store" });
//       }

//       // Update fields
//       if (email) store.email = email;
//       if (name) store.name = name;
//       if (location) store.location = location;
//       if (phone) store.phone = phone;
//       if (workingDays) store.workingDays = workingDays;
//       if (workingHrs) store.workingHrs = workingHrs;

//       // Handle new image upload
//       if (req.file) {
//         const uploadedFileName = req.file.filename; // Extract the filename of the uploaded file
//         store.image = `http://3.144.193.152:3000/uploads/${uploadedFileName}`; // Construct the full URL for the new image
//       } // Optionally handle other cases, such as deleting the image or keeping the existing one

//       await store.save(); // Save the updated store information
//       res.json({
//         success: true,
//         message: "Store updated successfully",
//         data: store,
//       });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ message: "Error updating store", error: error.message });
//     }
//   }
// );
router.put(
  "/update",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    console.log(req.body);
    const storeId = req.store.storeId;

    const { email, name, location, phone, workingHrs, workingDays } = req.body;

    try {
      let store = await Store.findById(storeId);
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

      // Handle new image upload
      if (req.file) {
        // If there's an existing image, delete it first
        if (store.image) {
          const existingImagePath = store.image.replace(
            /^http:\/\/3\.144\.193\.152:3000\/uploads\//,
            ""
          ); // Extract the filename from the URL
          const fullPath = path.join(__dirname, "uploads", existingImagePath);
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error("Failed to delete old image:", err.message);
              // Note: You might not want to return or throw an error here as it could interrupt the update process
            }
          });
        }

        const uploadedFileName = req.file.filename; // Extract the filename of the uploaded file
        store.image = `http://3.144.193.152:3000/uploads/${uploadedFileName}`; // Construct the full URL for the new image
      }

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
  }
);
module.exports = router;
