// backend/routes/contracts.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all contracts
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Contracts");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contracts." });
  }
});

// GET expired contracts
router.get("/expired", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Contracts WHERE EndDate < GETDATE()");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch expired contracts." });
  }
});

// POST new contract
router.post("/", async (req, res) => {
  const { memberId, startDate, endDate, contractType } = req.body;
  try {
    await db.query(
      "INSERT INTO Contracts (MemberID, StartDate, EndDate, ContractType) VALUES (@memberId, @startDate, @endDate, @contractType)",
      {
        memberId,
        startDate,
        endDate,
        contractType,
      }
    );
    res.json({ message: "✅ Contract added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add contract." });
  }
});

// PUT update contract
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, contractType } = req.body;
  try {
    await db.query(
      "UPDATE Contracts SET StartDate=@startDate, EndDate=@endDate, ContractType=@contractType WHERE ContractID=@id",
      {
        id,
        startDate,
        endDate,
        contractType,
      }
    );
    res.json({ message: "✅ Contract updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update contract." });
  }
});

// DELETE contract
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM Contracts WHERE ContractID=@id", { id });
    res.json({ message: "✅ Contract deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete contract." });
  }
});

module.exports = router;
