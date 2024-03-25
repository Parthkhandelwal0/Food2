const mongoose = require("mongoose");
const Counter = require("./Counter"); // Adjust the path as necessary

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: {
    type: String,
  },

  products: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  discount: { type: Number, required: true },
  number: { type: Number, unique: true },
});

OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "orderNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.number = counter.seq;
  }
  next();
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
