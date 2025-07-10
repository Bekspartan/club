// backend/routes/invoices.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all invoices
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Invoices");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoices." });
  }
});

// GET unpaid invoices
router.get("/unpaid", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Invoices WHERE Status = 'Unpaid'");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unpaid invoices." });
  }
});

// POST new invoice
router.post("/", async (req, res) => {
  const { memberId, amount, dueDate, status } = req.body;
  try {
    await db.query(
      "INSERT INTO Invoices (MemberID, Amount, DueDate, Status) VALUES (@memberId, @amount, @dueDate, @status)",
      { memberId, amount, dueDate, status }
    );
    res.json({ message: "✅ Invoice created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create invoice." });
  }
});

// PUT update invoice
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { amount, dueDate, status } = req.body;
  try {
    await db.query(
      "UPDATE Invoices SET Amount=@amount, DueDate=@dueDate, Status=@status WHERE InvoiceID=@id",
      { id, amount, dueDate, status }
    );
    res.json({ message: "✅ Invoice updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update invoice." });
  }
});

// DELETE invoice
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM Invoices WHERE InvoiceID=@id", { id });
    res.json({ message: "✅ Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete invoice." });
  }
});

module.exports = router;