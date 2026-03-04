const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    currentAmount: {
      type: Number,
      required: true,
    },
    minPayment: {
      type: Number,
      default: 0,
    },
    snowballPayment: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Debt", debtSchema);
