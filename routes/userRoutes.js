const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Cart = require("../models/Cart");

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
    res
      .status(400)
      .json({
        success: false,
        data: error.message,
        message: "password did not match",
      });
  }
});

// Update user information
router.put("/update", authenticateToken, async (req, res) => {
  const id = req.user.userId;
  const { username, password, name, location, phone } = req.body;

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
    if (username) user.username = username;
    if (name) user.name = name;
    if (location) user.location = location;
    if (phone) user.phone = phone;

    // Handle password change with hashing
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save(); // Save the updated user information
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
});

router.post("/cart", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Adjust based on your authentication middleware
  // Adjust based on your authentication middleware
  const { productId, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const price = product.price; // Assuming Product model has a price field
    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      // Cart exists, update it
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Product exists in cart, update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new product to cart
        cart.items.push({ product: productId, quantity, price });
      }
    } else {
      // No cart for user, create new cart
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity, price }],
      });
    }

    await cart.save();
    res.status(201).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

router.get("/cart", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Adjust based on your authentication middleware

  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product", "name price") // Adjust the fields you want to populate as needed
      .exec();

    if (!cart) {
      // Consider whether you want to return an empty cart or a not found status
      return res.status(404).json({ message: "Cart not found" });
    }

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving cart" });
  }
});

router.post("/orders", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming authenticateToken middleware adds user ID to req.user
  const { total, products, discount } = req.body; // Extracting order details from the request body
  const currentDate = new Date();
  const formattedDate = format(currentDate, "MMM dd, yyyy 'at' h:mm a"); // "Feb 25, 2023 at 8:32 PM"
  if (!userId) {
    return res.status(400).send("User ID is missing");
  }

  try {
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

    const send = {
      success: true,
      data: newOrder,
      message: "Order created successfully",
    };

    await newOrder.save();
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
    console.log(req);
    const userId = req.user.userId; // Adjust based on your authentication middleware
    const ordersFromDB = await Order.find({ user: userId })
      .populate("products.product") // Assuming a structure where each product in products array references a Product model
      .exec();

    const history = ordersFromDB.map((order) => ({
      id: order._id,
      number: order.number,
      date: order.date, // You might need to format this depending on how it's stored
      total: order.totalAmount,
      status: "done",
      delivery: "qwdqdeqw",
      discount: order.discount,
      products: order.products.map((p) => ({
        id: p.product._id, // Assuming the populated product document has an _id field
        name: p.product.name,
        quantity: p.quantity,
        price: p.product.price,
      })),
    }));

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

module.exports = router;
