// backend/routes/members.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // Updated path for db.js

// GET all members
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Members");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch members." });
  }
});

// GET unpaid members
router.get("/unpaid", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Members WHERE Amount > 0");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unpaid members." });
  }
});

// POST new member
router.post("/", async (req, res) => {
  const { FullName, Email, Sport } = req.body;
  try {
    await db.query(
      "INSERT INTO Members (FullName, Email, Sport) VALUES (@FullName, @Email, @Sport)",
      {
        FullName,
        Email,
        Sport,
      }
    );
    res.json({ message: "✅ Member added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add member." });
  }
});

// PUT update member
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { FullName, Email, Sport } = req.body;
  try {
    await db.query(
      "UPDATE Members SET FullName=@FullName, Email=@Email, Sport=@Sport WHERE MemberID=@id",
      {
        id,
        FullName,
        Email,
        Sport,
      }
    );
    res.json({ message: "✅ Member updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update member." });
  }
});

// DELETE member
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM Members WHERE MemberID=@id", { id });
    res.json({ message: "✅ Member deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete member." });
  }
});

module.exports = router;
