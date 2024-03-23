// routes/userAuthRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();
require("dotenv").config();

// Register User
router.post("/register", async (req, res) => {
  const { email, password, name, location, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const user = new User({
      email,
      password: hashedPassword,
      name,
      location,
      phone,
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const data = {
      token: token,
      user: {
        email: email,
        id: user._id,
        name: req.body.name,
        phone: req.body.phone,
      },
    };
    res
      .status(201)
      .json({ success: true, data: data, message: "register successful" });
  } catch (error) {
    res.json(error);
    // res.status(400).json({ error: "Registration failed" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const data = {
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    };
    console.log(req);
    res
      .status(201)
      .json({ success: true, data: data, message: "login successful" });
  } catch (error) {
    res.status(400).json({ error: "Login failed" });
  }
});

module.exports = router;
