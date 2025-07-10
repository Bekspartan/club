// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// POST login
router.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query("SELECT * FROM Users WHERE Email=@email", { email });
    const user = result.recordset[0];

    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.UserID, role: user.Role, username: user.Username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: { id: user.UserID, username: user.Username, role: user.Role } });
  } catch (err) {
    res.status(500).json({ error: "Login failed." });
  }
});

module.exports = router;
