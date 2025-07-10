// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/members", require("./routes/members"));
app.use("/api/contracts", require("./routes/contracts"));
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/users", require("./routes/users"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/login", require("./routes/auth"));

// Serve frontend build
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
