// routes/storeAuthRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Store = require("../models/Store");
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

// Register Store
router.post("/register", upload.single("image"), async (req, res) => {
  const {
    email,
    password,
    name,
    location,
    phone,
    workingHrs,
    workingDays,
    confirmPassword,
  } = req.body;
  try {
    const imagePath = req.file ? req.file.path : null;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const store = new Store({
      email,
      password: hashedPassword,
      name,
      location,
      phone,
      workingHrs,
      workingDays,
      image: imagePath,
    });
    await store.save();
    const token = jwt.sign({ storeId: store._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log(token);
    const data = {
      token: token,
      id: store._id,
      name: req.body.name,
      email: req.body.email,
      location: req.body.location,
      phone: req.body.phone,
      workingHrs: req.body.workingHrs,
      workingDays: req.body.workingDays,
      image: imagePath,
    };
    res.status(201).json({
      success: true,
      message: "register success",
      data: data,
    });
  } catch (error) {
    // res.json(error);
    res
      .status(400)
      .json({ success: true, message: "register failed", data: error.message });
  }
});

// Login Store
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const store = await Store.findOne({ email });
    if (!store || !(await bcrypt.compare(password, store.password))) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ storeId: store._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log(token);
    const data = {
      token: token,
      user: {
        id: store._id,
        email: store.email,
        name: store.name,
        location: store.location,
        phone: store.phone,
        workingHrs: store.workingHrs,
        workingDays: store.workingDays,
        photo: "image",
      },
    };
    res.status(201).json({
      success: true,
      message: "login success",
      data: data,
    });
  } catch (error) {
    res
      .status(400)
      .json({ success: true, message: "login failed", data: error.message });
  }
});

module.exports = router;
