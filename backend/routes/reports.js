// backend/routes/reports.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all reports for a member
router.get("/member/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM Reports WHERE MemberID=@id", { id });
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports." });
  }
});

// POST new report
router.post("/", async (req, res) => {
  const { memberId, reportType, reportText } = req.body;
  try {
    await db.query(
      "INSERT INTO Reports (MemberID, ReportType, ReportText, CreatedAt) VALUES (@memberId, @reportType, @reportText, GETDATE())",
      { memberId, reportType, reportText }
    );
    res.json({ message: "✅ Report saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save report." });
  }
});

module.exports = router;
