// backend/routes/messages.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all messages
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Messages ORDER BY ScheduledAt DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// POST new message
router.post("/", async (req, res) => {
  const { title, body, recipient, sentBy, scheduledAt } = req.body;
  try {
    await db.query(
      "INSERT INTO Messages (Title, Body, Recipient, SentBy, ScheduledAt) VALUES (@title, @body, @recipient, @sentBy, @scheduledAt)",
      { title, body, recipient, sentBy, scheduledAt }
    );
    res.json({ message: "✅ Message created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message." });
  }
});

module.exports = router;
