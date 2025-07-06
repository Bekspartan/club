const express = require("express");
const cors = require("cors");
const { poolConnect, pool, sql } = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// ✅ Test API root
app.get("/", (req, res) => {
  res.send("Club Management API is running...");
});

// ✅ 1. Get Members Attending a Specific Event
app.get("/api/events/members", async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).send("Missing event title");
  await poolConnect;
  try {
    const result = await pool.request()
      .input("eventTitle", sql.NVarChar, title)
      .query(`
        SELECT 
          m.MemberID,
          m.FirstName,
          m.LastName,
          e.Title AS EventTitle,
          me.Attended
        FROM Members m
        JOIN MemberEvents me ON m.MemberID = me.MemberID
        JOIN Events e ON me.EventID = e.EventID
        WHERE e.Title = @eventTitle
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/events/members):", err);
    res.status(500).send("Server error");
  }
});

// ✅ 2. Get Members with Unpaid Invoices
app.get("/api/members/unpaid", async (req, res) => {
  await poolConnect;
  try {
    const result = await pool.request().query(`
      SELECT 
        m.MemberID,
        m.FirstName,
        m.LastName,
        i.Amount,
        i.DueDate
      FROM 
        Members m
      JOIN 
        Invoices i ON m.MemberID = i.MemberID
      WHERE 
        i.IsPaid = 0
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/members/unpaid):", err);
    res.status(500).send("Server error");
  }
});

// ✅ 3. Get Members with Active Contracts
app.get("/api/contracts/active", async (req, res) => {
  await poolConnect;
  try {
    const result = await pool.request().query(`
      SELECT 
        m.MemberID,
        m.FirstName,
        m.LastName,
        c.ContractType,
        c.StartDate,
        c.EndDate,
        c.Status
      FROM 
        Members m
      JOIN 
        Contracts c ON m.MemberID = c.MemberID
      WHERE 
        c.Status = 'Active'
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/contracts/active):", err);
    res.status(500).send("Server error");
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
app.get("/api/contracts/expired", async (req, res) => {
  await poolConnect;
  try {
    const result = await pool.request().query(`
      SELECT m.FirstName, m.LastName, c.ContractType, c.EndDate
      FROM Members m
      JOIN Contracts c ON m.MemberID = c.MemberID
      WHERE c.EndDate < GETDATE()
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/contracts/expired):", err);
    res.status(500).send("Server error");
  }
});
app.get("/api/members/search", async (req, res) => {
  const { name } = req.query;
  await poolConnect;
  try {
    const result = await pool.request()
      .input("name", sql.NVarChar, `%${name}%`)
      .query(`
        SELECT MemberID, FirstName, LastName, Email
        FROM Members
        WHERE FirstName LIKE @name OR LastName LIKE @name
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/members/search):", err);
    res.status(500).send("Server error");
  }
});
app.get("/api/reports/member/:id", async (req, res) => {
  const { id } = req.params;
  await poolConnect;
  try {
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT ReportType, ReportText, CreatedAt
        FROM MemberReports
        WHERE MemberID = @id
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/reports/member/:id):", err);
    res.status(500).send("Server error");
  }
});
app.post("/api/members", async (req, res) => {
  const {
    FirstName,
    LastName,
    BirthDate,
    Gender,
    Email,
    Phone,
    Address,
    City,
    ZipCode
  } = req.body;

  await poolConnect;
  try {
    await pool.request()
      .input("FirstName", sql.NVarChar, FirstName)
      .input("LastName", sql.NVarChar, LastName)
      .input("BirthDate", sql.Date, BirthDate)
      .input("Gender", sql.Char, Gender)
      .input("Email", sql.NVarChar, Email)
      .input("Phone", sql.NVarChar, Phone)
      .input("Address", sql.NVarChar, Address)
      .input("City", sql.NVarChar, City)
      .input("ZipCode", sql.NVarChar, ZipCode)
      .query(`
        INSERT INTO Members (FirstName, LastName, BirthDate, Gender, Email, Phone, Address, City, ZipCode)
        VALUES (@FirstName, @LastName, @BirthDate, @Gender, @Email, @Phone, @Address, @City, @ZipCode)
      `);

    res.status(201).json({ message: "Member added successfully" });
  } catch (err) {
    console.error("SQL error (/api/members POST):", err);
    res.status(500).send("Server error");
  }
});
