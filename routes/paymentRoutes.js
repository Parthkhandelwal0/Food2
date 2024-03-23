const express = require("express");
const router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");

const stripe = require("stripe")(
  "sk_test_51NO9sUC3YreHlxPxyuT3jlZ6pXX6st9uGt73TNBtLdLFDodrkTlP5s3vW8FtcoCM2BrnIiNlcXxCD6vmlHBqN0Tx00v047E8bE"
);

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  console.log(req.headers);
  const token = req.headers["authorization"]?.split(" ")[1];
  console.log(token);
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

router.post("/intent", authenticateToken, async (req, res) => {
  try {
    console.log(req);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ paymentIntent: paymentIntent.client_secret });
  } catch (e) {
    res.status(400).json({
      error: e.message,
    });
  }
});

module.exports = router;
// 172.31.134.0:3000/payments/intent
