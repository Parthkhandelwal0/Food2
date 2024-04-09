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

router.get("/home", authenticateToken, async (req, res) => {
  const storeId = req.store.storeId; // Assuming authenticateToken middleware sets storeId

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found." });
    }

    // Optionally, fetch more detailed information if needed
    const totalRevenue = store.totalRevenue;
    const uniqueCustomerCount = store.uniqueCustomers.length; // Count of unique customers
    const totalProductsSold = store.totalProductsSold;

    // Count the number of products linked to this store
    const productsCount = await Product.countDocuments({ store: storeId });
    const totalViews = 1;

    // You can also add more metrics or data specific to the store's dashboard/home page
    const dataToSend = {
      id: store._id,
      name: store.name,
      totalRevenue: totalRevenue,
      uniqueCustomerCount: uniqueCustomerCount,
      totalProductsSold: totalProductsSold,
      totalViews: totalViews,
    };

    res.json({
      success: true,
      data: dataToSend,
      message: "Store home data sent",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error retrieving store home data" });
  }
});

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

    const formattedStores = await Promise.all(
      stores.map(async (store) => {
        // Count the number of products linked to this store
        const productsCount = await Product.countDocuments({
          store: store._id,
        });
        return {
          id: store._id,
          workingDays: store.workingDays,
          title: store.name,
          image: store.image,
          quantity: productsCount, // Include the count of products
          // Map any additional fields as needed
        };
      })
    );

    res.json({ success: true, data: formattedStores, message: "Stores sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching stores" });
  }
});

router.post("/search", async (req, res) => {
  const searchTerm = req.body.term;

  if (!searchTerm) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const regex = new RegExp(searchTerm, "i"); // 'i' for case insensitive matching
    const matchingStores = await Store.find({ name: { $regex: regex } });

    const formattedStores = await Promise.all(
      matchingStores.map(async (store) => {
        // Count the number of products linked to this store
        const productsCount = await Product.countDocuments({
          store: store._id,
        });
        return {
          id: store._id,
          title: store.name,
          image: store.image,
          quantity: productsCount, // Include the count of products
          // Map any additional fields as needed
        };
      })
    );

    // Optionally, enhance matchingStores with product counts or other related data as above

    res.json({
      success: true,
      data: formattedStores,
      message: "Search results",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error performing search" });
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

      if (req.store.storeId !== store._id.toString()) {
        return res
          .status(403)
          .json({ message: "You can only update your own store" });
      }

      if (email) store.email = email;
      if (name) store.name = name;
      if (location) store.location = location;
      if (phone) store.phone = phone;
      if (workingDays) store.workingDays = workingDays;
      if (workingHrs) store.workingHrs = workingHrs;

      if (req.file) {
        // If there's an existing image, delete it
        if (store.image) {
          const existingImagePath = store.image.replace(
            "http://3.144.193.152:3000/uploads/",
            ""
          );
          const fullExistingImagePath = path.join(uploadDir, existingImagePath);
          try {
            fs.unlinkSync(fullExistingImagePath);
            console.log("Successfully deleted the existing image.");
          } catch (err) {
            console.error("Error deleting the existing image:", err.message);
            // Continue updating the store even if deleting the old image fails
          }
        }
        const uploadedFileName = req.file.filename; // Extract the filename of the uploaded file
        store.image = `http://3.144.193.152:3000/uploads/${uploadedFileName}`; // Update store's image with the new URL
      }

      await store.save();
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
