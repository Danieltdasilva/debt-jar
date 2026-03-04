require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Debt = require("./models/Debt");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("API is running");
});

// GET /api/debts - Get all debts
app.get("/api/debts", async (req, res) => {
  try {
    const debts = await Debt.find();
    res.json(debts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/debts - Create a new debt
app.post("/api/debts", async (req, res) => {
  const debt = new Debt({
    name: req.body.name,
    originalAmount: req.body.originalAmount,
    currentAmount: req.body.currentAmount,
    minPayment: req.body.minPayment || 0,
    snowballPayment: req.body.snowballPayment || 0,
  });

  try {
    const newDebt = await debt.save();
    res.status(201).json(newDebt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/debts/:id - Update a debt
app.put("/api/debts/:id", async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) {
      return res.status(404).json({ message: "Debt not found" });
    }

    if (req.body.name !== undefined) debt.name = req.body.name;
    if (req.body.originalAmount !== undefined) debt.originalAmount = req.body.originalAmount;
    if (req.body.currentAmount !== undefined) debt.currentAmount = req.body.currentAmount;
    if (req.body.minPayment !== undefined) debt.minPayment = req.body.minPayment;
    if (req.body.snowballPayment !== undefined) debt.snowballPayment = req.body.snowballPayment;

    const updatedDebt = await debt.save();
    res.json(updatedDebt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/debts/:id - Delete a debt
app.delete("/api/debts/:id", async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) {
      return res.status(404).json({ message: "Debt not found" });
    }

    await debt.deleteOne();
    res.json({ message: "Debt deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
