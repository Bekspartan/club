// backend/routes/users.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

// GET all users
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Users");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// POST create user
router.post("/", async (req, res) => {
  const { username, email, role, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO Users (Username, Email, Role, PasswordHash) VALUES (@username, @email, @role, @hashed)",
      { username, email, role, hashed }
    );
    res.json({ message: "✅ User created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user." });
  }
});

// PUT update user role
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    await db.query("UPDATE Users SET Role=@role WHERE UserID=@id", { id, role });
    res.json({ message: "✅ User updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM Users WHERE UserID=@id", { id });
    res.json({ message: "✅ User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

module.exports = router;
