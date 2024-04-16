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
// router.post(
//   "/",
//   authenticateToken,
//   upload.array("images", 5), // Adjust '5' to the max number of images you'd allow

//   async (req, res) => {
//     const {
//       name,
//       price,
//       old_price,
//       serving_size,
//       calories,
//       total_fat,
//       saturated_fat,
//       total_sugars,
//       protein,
//       quantity,
//     } = req.body;
//     const imagesPaths = req.files.map((file) => file.path); // Array of image paths
//     if (req.body.id) {
//       try {
//         const productUpdates = {
//           name,
//           price,
//           old_price,
//           serving_size,
//           calories,
//           total_fat,
//           saturated_fat,
//           total_sugars,
//           protein,
//           quantity,
//           // Omit images here since they're handled separately
//         };

//         // Filter out undefined fields
//         Object.keys(productUpdates).forEach(
//           (key) =>
//             productUpdates[key] === undefined && delete productUpdates[key]
//         );

//         // Find the product and update it with the new values. Use new: true to return the updated document
//         const updatedProduct = await Product.findByIdAndUpdate(
//           req.body.id,
//           productUpdates,
//           { new: true }
//         );

//         // If there are new images, update the product's images field; otherwise, retain existing images
//         if (req.files && req.files.length > 0) {
//           updatedProduct.images = req.files.map((file) => file.path);
//           await updatedProduct.save(); // Save the product if there were changes to the images
//         }

//         if (!updatedProduct) {
//           return res.status(404).json({ message: "Product not found" });
//         }

//         res.json({
//           message: "Product updated successfully",
//           product: updatedProduct,
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(400).json({ error: "Failed to update product" });
//       }
//     } else {
//       try {
//         const product = new Product({
//           name,
//           price,
//           old_price,
//           serving_size,
//           calories,
//           total_fat,
//           saturated_fat,
//           total_sugars,
//           protein,
//           quantity,
//           images: imagesPaths, // Array of image URLs
//           store: req.store.storeId, // Ensure this matches how you're setting the store ID in your middleware
//         });

//         const data = {
//           name: name,
//           price: price,
//           old_price: old_price,
//           serving_size: serving_size,
//           calories: calories,
//           total_fat: total_fat,
//           saturated_fat: saturated_fat,
//           total_sugars: total_sugars,
//           protein: protein,
//           quantity: quantity,
//           id: product._id,
//           images: imagesPaths,
//         };

//         await product.save();
//         res.status(201).json({
//           success: true,
//           message: "Product created successfully",
//           data: data,
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(400).json({ error: "Product creation failed" });
//       }
//     }
//   }
// );

router.post(
  "/",
  authenticateToken,
  upload.single("images"), // Adjust '5' to the max number of images you'd allow
  async (req, res) => {
    const {
      name,
      description,
      sellByDate,
      price,
      old_price,
      serving_size,
      calories,
      total_fat,
      saturated_fat,
      total_sugars,
      protein,
      quantity,
    } = req.body;
    let imagesUrl = [];
    console.log(req.file);
    if (req.file) {
      const uploadedFileName = req.file.filename; // Extract the filename of the uploaded file
      imagesUrl = `http://3.144.193.152:3000/uploads/${uploadedFileName}`; // Construct the full URL
    }
    if (req.body.id) {
      try {
        const productUpdates = {
          description,
          sellByDate,
          name,
          price,
          sellByDate,
          description,
          old_price,
          serving_size,
          calories,
          total_fat,
          saturated_fat,
          total_sugars,
          protein,
          quantity,
          // Omit images here since they're handled separately
        };

        // Filter out undefined fields
        Object.keys(productUpdates).forEach(
          (key) =>
            productUpdates[key] === undefined && delete productUpdates[key]
        );

        const updatedProduct = await Product.findByIdAndUpdate(
          req.body.id,
          productUpdates,
          { new: true }
        );

        if (imagesUrl.length > 0) {
          updatedProduct.images = imagesUrl;
          await updatedProduct.save(); // Save the product if there were changes to the images
        }

        if (!updatedProduct) {
          return res.status(404).json({ message: "Product not found" });
        }

        res.json({
          success: true,
          message: "Product updated successfully",
          data: {
            id: product._id,
            sellByDate: product.sellByDate,
            description: product.description,
            name: product.name,
            price: product.price,
            old_price: product.old_price,
            serving_size: product.serving_size,
            calories: product.calories,
            total_fat: product.total_fat,
            saturated_fat: product.saturated_fat,
            total_sugars: product.total_sugars,
            protein: product.protein,
            quantity: product.quantity,
            images: product.images,
          },
        });
      } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to update product" });
      }
    } else {
      try {
        const product = new Product({
          description,
          sellByDate,
          name,
          price,
          old_price,
          sellByDate,
          description,
          serving_size,
          calories,
          total_fat,
          saturated_fat,
          total_sugars,
          protein,
          quantity,
          images: imagesUrl, // Use the URLs instead of local paths
          store: req.store.storeId,
        });

        await product.save();

        res.status(201).json({
          success: true,
          message: "Product created successfully",
          data: {
            id: product._id,
            sellByDate: product.sellByDate,
            description: product.description,
            name: product.name,
            price: product.price,
            old_price: product.old_price,
            serving_size: product.serving_size,
            calories: product.calories,
            total_fat: product.total_fat,
            saturated_fat: product.saturated_fat,
            total_sugars: product.total_sugars,
            protein: product.protein,
            quantity: product.quantity,
            images: product.images,
          },
        });
      } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Product creation failed" });
      }
    }
  }
);

router.get("/", authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ store: req.store.storeId })
      .populate("store", "name") // Assuming you want to include some store details; adjust as needed
      .exec();

    const data = products.map((product) => ({
      id: product.id,
      sellByDate: product.sellByDate,
      description: product.description,
      name: product.name,
      price: product.price,
      old_price: product.old_price,
      serving_size: product.serving_size,
      calories: product.calories,
      total_fat: product.total_fat,
      saturated_fat: product.saturated_fat,
      total_sugars: product.total_sugars,
      protein: product.protein,
      quantity: product.quantity,
      images: product.images, // Assuming images is already an array of URLs
      // Include any other product fields you need to send
    }));

    res.json({
      success: true,
      data: data,
      message: "products sent",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Route to update product quantities
// router.post("/updateQuantities", async (req, res) => {
//   try {
//     const updates = req.body; // Assuming the body is an array of { id, quantity }

//     const updatedProducts = [];

//     // Loop through each update and modify the corresponding product
//     for (const update of updates) {
//       const product = await Product.findById(update.id);
//       if (product) {
//         product.quantity = update.quantity;
//         await product.save();
//         updatedProducts.push(product); // Add the updated product to the array
//       } else {
//         return res
//           .status(404)
//           .json({ message: `Product with id ${update.id} not found` });
//       }
//     }

//     res.json({ success: true, data: updatedProducts, message: "updated" }); // Send the updated products as response
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "An error occurred", error: error.message });
//   }
// });

router.post("/updateQuantities", async (req, res) => {
  try {
    const updates = req.body; // Assuming the body is an array of { id, quantity }
    const updatedProducts = [];

    // Loop through each update and modify the corresponding product
    for (const update of updates) {
      const product = await Product.findById(update.id);
      if (product) {
        product.quantity = update.quantity;
        await product.save();

        // Convert the Mongoose document to a plain JavaScript object
        const productObject = product.toObject();

        // Remove the _id field and replace it with id
        delete productObject._id;
        productObject.id = product.id; // Use Mongoose's .id property which is a string representation of the document's _id

        updatedProducts.push(productObject); // Add the updated product to the array
      } else {
        return res
          .status(404)
          .json({ message: `Product with id ${update.id} not found` });
      }
    }

    // Send the updated products as response
    res.json({
      success: true,
      data: updatedProducts,
      message: "Products quantities updated",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
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
router.get("/:storeId", async (req, res) => {
  const { storeId } = req.params;
  console.log(req);
  try {
    const products = await Product.find({ store: storeId }).lean(); // Find all products for the given store

    // Format each product
    const formattedProducts = products.map((product) => ({
      id: product._id, // Assuming you want to rename _id to id
      name: product.name,
      // images: [
      //   "https://images.heb.com/is/image/HEBGrocery/000466634-1?jpegSize=150&hei=1400&fit=constrain&qlt=75",
      // ],
      images: product.images,
      description: product.name,
      price: product.price,
      old_price: product.old_price, // Include only if present
      nutrition_information: {
        serving_size: product.serving_size,
        calories: product.calories,
        total_fat: product.total_fat,
        saturated_fat: product.saturated_fat,
        total_sugars: product.total_sugars,
        protein: product.protein,
      },
      reviews: [
        {
          id: 1,
          name: "Adrianna Mercado",
          image: "https://george-fx.github.io/funiq/resources/reviews/01.jpg",
          comment:
            "Consequat ut ea dolor aliqua laborum tempor Lorem culpa. Commodo veniam sint est mollit proident commodo.",
          rating: 5,
          date: "23 Jan",
        },
      ], // Assuming reviews are stored within the product document
    }));

    res.json({
      success: true,
      data: formattedProducts,
      message: "Products retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to retrieve products", error: error.message });
  }
});

module.exports = router;
