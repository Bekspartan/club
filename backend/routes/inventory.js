// backend/routes/inventory.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all items
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Inventory");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inventory." });
  }
});

// POST new item
router.post("/", async (req, res) => {
  const { name, category, condition } = req.body;
  try {
    await db.query(
      "INSERT INTO Inventory (Name, Category, Condition) VALUES (@name, @category, @condition)",
      { name, category, condition }
    );
    res.json({ message: "✅ Item added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add item." });
  }
});

// PUT update item
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, category, condition } = req.body;
  try {
    await db.query(
      "UPDATE Inventory SET Name=@name, Category=@category, Condition=@condition WHERE ItemID=@id",
      { id, name, category, condition }
    );
    res.json({ message: "✅ Item updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update item." });
  }
});

// DELETE item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM Inventory WHERE ItemID=@id", { id });
    res.json({ message: "✅ Item deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item." });
  }
});

module.exports = router;
