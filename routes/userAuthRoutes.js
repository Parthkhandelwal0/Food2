// routes/userAuthRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();
require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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

// Register User
router.post("/register", upload.single("photo"), async (req, res) => {
  const { email, password, name, location, phone } = req.body;
  try {
    let imageUrl = null;
    if (req.file) {
      const uploadedFileName = req.file.filename; // Extract the filename of the uploaded file
      imageUrl = `http://3.144.193.152:3000/uploads/${uploadedFileName}`; // Construct the full URL
    }
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const user = new User({
      email,
      password: hashedPassword,
      name,
      location,
      phone,
      image: imageUrl,
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const data = {
      token: token,
      user: {
        image: imageUrl,
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
