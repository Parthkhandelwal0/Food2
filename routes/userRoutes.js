const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Store = require("../models/Store");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const nodemailer = require("nodemailer");

require("dotenv").config();
const Product = require("../models/Product");
const Order = require("../models/Order");

const router = express.Router();

const { format } = require("date-fns"); // CommonJS syntax
// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token)
    return res.status(403).send("A token is required for authentication");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    console.log(token);
    return res.status(401).send("Invalid Token");
  }
  return next();
};

let transporter = nodemailer.createTransport({
  service: "gmail", // For Gmail
  auth: {
    user: "kparth2010@gmail.com", // Your Gmail address
    pass: "ckco omiw qkht npew ", // Your Gmail password or App Password
  },
});

router.post("/stores", async (req, res) => {
  try {
    console.log(req.body);
    userLocation = req.body.location;
    const stores = await Store.find({}); // Fetch all stores from the database

    // Formatting the response object as specified
    const formattedResponse = stores.reduce((acc, store, index) => {
      const key = `store${index + 1}`; // Creating keys dynamically based on index: storeone, storetwo, etc.
      acc[key] = {
        latlng: {
          latitude: store.coordinates.latitude, // Assuming your Store model has a coordinates field
          longitude: store.coordinates.longitude,
        },
        key: store._id,
        title: store.name, // Assuming your Store model uses 'title' for the store name
        description: "store.description", // Assuming your Store model has a description field
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: formattedResponse,
      message: "markers sent",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      data: error.message,
      message: "error sent",
    });
  }
});

router.post("/chechPassword", async (req, res) => {
  const { password } = req.body;
  const id = req.user.userId;
  try {
    const user = await User.findOne({ id });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    console.log(req);
    res
      .status(201)
      .json({ success: true, data: user, message: "password matched" });
  } catch (error) {
    res.status(400).json({
      success: false,
      data: error.message,
      message: "password did not match",
    });
  }
});
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
// Update user information
router.put(
  "/update",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    const id = req.user.userId;
    const { email, password, name, location, phone } = req.body;

    try {
      let user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the requester is the user owner
      if (req.user.userId !== user._id.toString()) {
        return res
          .status(403)
          .json({ message: "You can only update your own user" });
      }

      // Update fields
      if (email) user.email = email;
      if (name) user.name = name;
      if (location) user.location = location;
      if (phone) user.phone = phone;

      if (req.file) {
        // If there's an existing image, delete it
        if (user.photo) {
          const existingImagePath = user.photo.replace(
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
        console.log(uploadedFileName);
        user.photo = `http://3.144.193.152:3000/uploads/${uploadedFileName}`; // Update store's image with the new URL
        console.log(uploadedFileName);
      }
      // Handle password change with hashing
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save(); // Save the updated user information
      res.json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating user", error: error.message });
    }
  }
);

router.post("/cart", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Adjust based on your authentication middleware
  // Adjust based on your authentication middleware
  const { id, quantity } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const price = product.price; // Assuming Product model has a price field
    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      // Cart exists, update it
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === id
      );

      if (itemIndex > -1) {
        // Product exists in cart, update quantity
        cart.items[itemIndex].quantity = quantity;
      } else {
        // Add new product to cart
        cart.items.push({ product: id, quantity, price });
      }
    } else {
      // No cart for user, create new cart
      cart = new Cart({
        user: userId,
        items: [{ product: id, quantity, price }],
      });
    }

    await cart.save();
    res.status(201).json({ success: true, data: cart, message: "cart stored" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

// router.get("/cart", authenticateToken, async (req, res) => {
//   const userId = req.user.userId; // Adjust based on your authentication middleware

//   try {
//     const cart = await Cart.findOne({ user: userId })
//       .populate("items.product", "name price") // Adjust the fields you want to populate as needed
//       .exec();

//     if (!cart) {
//       // Consider whether you want to return an empty cart or a not found status
//       return res.status(404).json({ message: "Cart not found" });
//     }

//     res.json({ success: true, data: cart, message: "cart stored" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error retrieving cart" });
//   }
// });

router.get("/cart", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  console.log(`Cart request : ${req}`);

  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .exec();

    if (!cart) {
      return res
        .status(201)
        .json({ success: false, message: "Cart not found" });
    }

    // Transform the cart items to match the required format
    const transformedItems = cart.items.map((item) => ({
      id: item.product._id,
      name: item.product.name,
      // images: [
      //   "https://images.heb.com/is/image/HEBGrocery/000466634-1?jpegSize=150&hei=1400&fit=constrain&qlt=75",
      // ], // Assuming images is an array field in Product
      images: item.product.images,
      description: item.product.description,
      price: item.price,
      old_price: item.product.old_price, // Assuming old_price is a field in Product
      nutrition_information: {
        serving_size: item.product.serving_size,
        calories: item.product.calories,
        total_fat: item.product.total_fat,
        saturated_fat: item.product.saturated_fat,
        total_sugars: item.product.total_sugars,
        protein: item.product.protein,
      },
      reviews: [], // Assuming reviews is an array field in Product
      quantity: item.quantity,
    }));

    // Calculate the total price of items in the cart
    const total = transformedItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    // Example discount calculation (modify as per your discount logic)
    const discount = total * 0.05; // 5% discount for example

    // Example delivery fee (modify as per your delivery fee logic)
    const delivery = 2;

    res.json({
      success: true,
      data: {
        list: transformedItems,
        total: total,
        discount: 2.88,
      },
      message: "Cart data sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving cart" });
  }
});

router.post("/orders", authenticateToken, async (req, res) => {
  const userId = req.user.userId; //  authenticateToken middleware adds user ID to req.user
  console.log(userId);
  const { total, products, discount } = req.body; // Extracting order details from the request body
  const currentDate = new Date();
  const user = await User.findById(userId); // Fetch user details  console.log(userFromDB);

  const formattedDate = format(currentDate, "MMM dd, yyyy 'at' h:mm a"); // "Feb 25, 2023 at 8:32 PM"
  if (!userId) {
    return res.status(400).send("User ID is missing");
  }

  try {
    const firstProduct = await Product.findById(products[0].id).populate(
      "store"
    );
    const newOrder = new Order({
      user: userId,
      totalAmount: total,
      date: formattedDate,
      products: products.map((product) => ({
        product: product.id, // Assuming the product ID is what's needed here
        name: product.name,
        quantity: product.quantity,
        price: product.price,
      })),
      discount: discount,
    });
    await newOrder.save();

    // Reduce product quantity or delete if quantity becomes 0
    for (const product of products) {
      let productToUpdate = await Product.findById(product.id);
      if (productToUpdate) {
        productToUpdate.quantity -= product.quantity;
        if (productToUpdate.quantity <= 0) {
          await Product.deleteOne({ _id: product.id }); // Delete product if quantity is 0 or less
        } else {
          await productToUpdate.save(); // Update product with reduced quantity
        }
      }
    }

    const send = {
      success: true,
      data: newOrder,
      message: "Order created successfully",
    };

    await Cart.findOneAndDelete({ user: userId });

    const mailOptions = {
      from: '"Food2" <yourgmail@gmail.com>', // sender address
      to: user.email, // list of receivers, assuming user model has an email field
      subject: "Food2 - Order Confirmation", // Subject line
      // text: `Your order has been placed successfully on ${formattedDate}. Order Details: ${products
      //   .map((p) => `${p.name}, Quantity: ${p.quantity}, Price: ${p.price}`)
      //   .join("; ")}. Total Amount: ${total}. Discount: ${discount}.`, // plain text body
      html: `
      <h1>Order Confirmation</h1>
      <p>Your order has been placed successfully on ${formattedDate}.</p>
      <h2>Order Details:</h2>
      <ul>
        ${products
          .map(
            (p) =>
              `<li>${p.name}, Quantity: ${
                p.quantity
              }, Price: $${p.price.toFixed(2)}</li>`
          )
          .join("")}
      </ul>
      <p><strong>Total Amount:</strong> $${total.toFixed(2)}</p>
    `,
    };

    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Email could not be sent: " + error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.status(201).json(send);
  } catch (error) {
    const send = {
      success: false,
      data: error.message,
      message: "order failed",
    };
    console.error(error);
    res.status(400).json(send);
  }
});

router.get("/orders", authenticateToken, async (req, res) => {
  try {
    // console.log(req);
    const userId = req.user.userId; // Adjust based on your authentication middleware
    console.log(userId);
    const ordersFromDB = await Order.find({ user: userId });
    console.log("Orders from DB:", ordersFromDB);
    const history = ordersFromDB.map((order) => ({
      id: order._id,
      number: order.number,
      date: order.date, // You might need to format this depending on how it's stored
      total: order.totalAmount,
      status: "done",
      delivery: "qwdqdeqw",
      discount: order.discount,
      products: order.products.map((p) => ({
        // id: p.product._id, // Assuming the populated product document has an _id field
        name: p.name,
        quantity: p.quantity,
        price: p.price,
      })),
    }));

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

module.exports = router;
