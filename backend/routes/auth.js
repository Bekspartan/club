const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { poolConnect, pool, sql } = require("../db");

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("Username", sql.NVarChar, username)
      .query("SELECT * FROM Users WHERE Username = @Username");

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: "Invalid username" });

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { userId: user.UserID, username: user.Username, role: user.Role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "2h" }
    );

    res.json({ token, username: user.Username, role: user.Role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
