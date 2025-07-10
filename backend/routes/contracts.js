const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Add new contract
router.post('/', async (req, res) => {
  const { MemberID, ContractType, StartDate, EndDate, Status, Notes } = req.body;

  try {
    let pool = await sql.connect(dbConfig);

    await pool.request()
      .input('MemberID', sql.Int, MemberID)
      .input('ContractType', sql.NVarChar, ContractType)
      .input('StartDate', sql.Date, StartDate)
      .input('EndDate', sql.Date, EndDate || null)
      .input('Status', sql.NVarChar, Status || 'Active')
      .input('Notes', sql.NVarChar, Notes || '')
      .query(`
        INSERT INTO Contracts (MemberID, ContractType, StartDate, EndDate, Status, Notes)
        VALUES (@MemberID, @ContractType, @StartDate, @EndDate, @Status, @Notes)
      `);

    res.status(201).json({ message: 'Contract added successfully' });

  } catch (err) {
    console.error('Error adding contract:', err);
    res.status(500).json({ error: 'Failed to add contract' });
  }
});

module.exports = router;
