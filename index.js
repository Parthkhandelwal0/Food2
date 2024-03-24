require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const storeAuthRoutes = require("./routes/storeAuthRoutes");
const userAuthRoutes = require("./routes/userAuthRoutes");
const productRoutes = require("./routes/productRoutes");
const storeRoutes = require("./routes/storeRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const path = require("path");

const app = express();
app.use(express.json());
app.use("/uploads", express.static("/home/ubuntu/Food2/routes/uploads"));
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/store", storeAuthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores", storeRoutes);
app.use("/payments", paymentRoutes);

app.use("/api/user", userAuthRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
