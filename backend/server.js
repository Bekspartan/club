const express = require("express");
const cors = require("cors");
const { poolConnect, pool, sql } = require("./db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // ✅ Required to handle file system operations

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// ✅ Create 'uploads' folder if not exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ✅ Serve uploaded files statically (e.g. http://localhost:5000/uploads/filename.pdf)
app.use("/uploads", express.static(uploadsDir));

// ✅ Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// ✅ Test API root
app.get("/", (req, res) => {
  res.send("Club Management API is running...");
});

// ✅ Authentication (Login)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("Username", sql.NVarChar(50), username)
      .query("SELECT * FROM Users WHERE Username = @Username");

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: "Invalid username" });

    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!passwordMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { userId: user.UserID, username: user.Username, role: user.Role },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "2h" }
    );

    res.json({ token, username: user.Username, role: user.Role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Members: Create
app.post("/api/members", async (req, res) => {
  const { FirstName, LastName, BirthDate, Gender, Email, Phone, Address, City, ZipCode } = req.body;

  try {
    await poolConnect;
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
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get all members (optional: add pagination)
app.get("/api/members", async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT MemberID, FirstName, LastName, Email FROM Members
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/api/members):", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Search members by name
app.get("/api/members/search", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).send("Missing name query");

  try {
    await poolConnect;
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

// ✅ Get unpaid invoices
app.get("/api/members/unpaid", async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT M.MemberID, M.FirstName, M.LastName, I.Amount, I.DueDate
      FROM Members M
      JOIN Invoices I ON M.MemberID = I.MemberID
      WHERE I.IsPaid = 0
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/members/unpaid):", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Create invoice
app.post("/api/invoices", async (req, res) => {
  const { MemberID, Amount, DueDate, Description } = req.body;

  if (!MemberID || !Amount || !DueDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await poolConnect;
    await pool.request()
      .input("MemberID", sql.Int, MemberID)
      .input("Amount", sql.Decimal(10, 2), Amount)
      .input("DueDate", sql.Date, DueDate)
      .input("Description", sql.NVarChar, Description || "")
      .query(`
        INSERT INTO Invoices (MemberID, Amount, DueDate, Description)
        VALUES (@MemberID, @Amount, @DueDate, @Description)
      `);
    res.status(201).json({ message: "Invoice created successfully" });
  } catch (err) {
    console.error("SQL error (/invoices POST):", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Create contract
app.post("/api/contracts", async (req, res) => {
  const { MemberID, ContractType, StartDate, EndDate, Notes } = req.body;

  try {
    await poolConnect;
    await pool.request()
      .input("MemberID", sql.Int, MemberID)
      .input("ContractType", sql.NVarChar, ContractType)
      .input("StartDate", sql.Date, StartDate)
      .input("EndDate", sql.Date, EndDate)
      .input("Notes", sql.NVarChar, Notes)
      .query(`
        INSERT INTO Contracts (MemberID, ContractType, StartDate, EndDate, Notes)
        VALUES (@MemberID, @ContractType, @StartDate, @EndDate, @Notes)
      `);

    res.status(201).json({ message: "Contract added successfully" });
  } catch (err) {
    console.error("SQL error (/contracts POST):", err);
    res.status(500).send("Server error");
  }
});

// ✅ Get active contracts
app.get("/api/contracts/active", async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        m.MemberID,
        m.FirstName,
        m.LastName,
        c.ContractType,
        c.StartDate,
        c.EndDate,
        c.Status
      FROM Members m
      JOIN Contracts c ON m.MemberID = c.MemberID
      WHERE c.Status = 'Active'
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/contracts/active):", err);
    res.status(500).send("Server error");
  }
});

// ✅ Get expired contracts
app.get("/api/contracts/expired", async (req, res) => {
  try {
    await poolConnect;
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

// ✅ Get members attending an event
app.get("/api/events/members", async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).send("Missing event title");

  try {
    await poolConnect;
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

// ✅ Get reports for a specific member
app.get("/api/reports/member/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await poolConnect;
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

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("Email", sql.NVarChar(100), email)
      .query("SELECT * FROM Users WHERE Email = @Email OR Username = @Email");

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Simulate sending reset email
    console.log(`✅ Reset link for ${user.Username}: http://localhost:3000/reset-password?user=${user.UserID}`);

    res.json({ message: "Reset instructions sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get('/api/dashboard/stats', async (req, res) => {
  await poolConnect;
  try {
    const totalMembers = await pool.request().query('SELECT COUNT(*) as count FROM Members');
    const unpaidInvoices = await pool.request().query('SELECT COUNT(*) as count FROM Invoices WHERE IsPaid = 0');
    const activeContracts = await pool.request().query("SELECT COUNT(*) as count FROM Contracts WHERE Status = 'Active'");
    const expiredContracts = await pool.request().query("SELECT COUNT(*) as count FROM Contracts WHERE EndDate < GETDATE()");
    const upcomingEvents = await pool.request().query("SELECT COUNT(*) as count FROM Events WHERE EventDate >= GETDATE()");

    res.json({
      totalMembers: totalMembers.recordset[0].count,
      unpaidInvoices: unpaidInvoices.recordset[0].count,
      activeContracts: activeContracts.recordset[0].count,
      expiredContracts: expiredContracts.recordset[0].count,
      upcomingEvents: upcomingEvents.recordset[0].count,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error("SQL error (/api/dashboard/stats):", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ FEATURE: Member Edit & Delete
// This includes:
// - MembersList.js with Edit/Delete buttons
// - EditMember.js form page
// - Backend endpoints for PUT / DELETE

/** 1. BACKEND: Add routes to server.js **/

// PUT update member
app.put("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, sport } = req.body;
  try {
    await poolConnect;
    await pool.request()
      .input("MemberID", sql.Int, id)
      .input("FullName", sql.NVarChar(100), fullName)
      .input("Email", sql.NVarChar(100), email)
      .input("Phone", sql.NVarChar(20), phone)
      .input("Sport", sql.NVarChar(50), sport)
      .query(`
        UPDATE Members
        SET FullName = @FullName, Email = @Email, Phone = @Phone, Sport = @Sport
        WHERE MemberID = @MemberID
      `);
    res.json({ message: "Member updated successfully" });
  } catch (err) {
    console.error("SQL error (PUT /members/:id):", err);
    res.status(500).send("Server error");
  }
});

// DELETE member
app.delete("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await poolConnect;
    await pool.request()
      .input("MemberID", sql.Int, id)
      .query(`DELETE FROM Members WHERE MemberID = @MemberID`);
    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    console.error("SQL error (DELETE /members/:id):", err);
    res.status(500).send("Server error");
  }
});


/** 2. FRONTEND FILES TO CREATE **/

// src/pages/MembersList.js
// src/pages/EditMember.js

// These include member table, edit button (with link to form), delete button (with confirmation)
// We'll display all members with search and actions.
// Add to server.js

// Create automated message
app.post("/api/messages", async (req, res) => {
  const { title, body, recipientType, scheduledAt } = req.body;
  await poolConnect;
  try {
    await pool.request()
      .input("Title", sql.NVarChar, title)
      .input("Body", sql.NVarChar(sql.MAX), body)
      .input("RecipientType", sql.NVarChar, recipientType) // e.g. 'All', 'UnpaidOnly', 'Specific'
      .input("ScheduledAt", sql.DateTime, scheduledAt || null)
      .query(`
        INSERT INTO Messages (Title, Body, RecipientType, ScheduledAt)
        VALUES (@Title, @Body, @RecipientType, @ScheduledAt)
      `);
    res.status(201).json({ message: "Message saved." });
  } catch (err) {
    console.error("Message Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/invoices", async (req, res) => {
  const { status } = req.query;
  await poolConnect;
  try {
    let query = `
      SELECT 
        i.InvoiceID,
        m.FullName,
        i.Amount,
        i.DueDate,
        i.IsPaid
      FROM Invoices i
      JOIN Members m ON i.MemberID = m.MemberID
    `;

    if (status === "paid") query += " WHERE i.IsPaid = 1";
    else if (status === "unpaid") query += " WHERE i.IsPaid = 0";

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/api/invoices):", err);
    res.status(500).send("Server error");
  }
});
// ✅ Get all contracts (optionally filtered by status or member)
app.get("/api/contracts", async (req, res) => {
  const { status, memberId } = req.query;

  await poolConnect;
  try {
    let query = `
      SELECT 
        c.ContractID, m.FullName, c.ContractType, c.StartDate, c.EndDate, c.Status
      FROM Contracts c
      JOIN Members m ON c.MemberID = m.MemberID
      WHERE 1 = 1
    `;

    if (status) query += ` AND c.Status = @status`;
    if (memberId) query += ` AND m.MemberID = @memberId`;

    const request = pool.request();
    if (status) request.input("status", sql.NVarChar, status);
    if (memberId) request.input("memberId", sql.Int, memberId);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/api/contracts):", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Reset Password Route
app.post("/api/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    await poolConnect;
    const result = await pool
      .request()
      .input("Token", sql.NVarChar(255), token)
      .query(`
        SELECT * FROM Users 
        WHERE ResetToken = @Token AND ResetTokenExpiry > GETDATE()
      `);

    const user = result.recordset[0];
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    await pool
      .request()
      .input("UserID", sql.Int, user.UserID)
      .input("Hash", sql.NVarChar, hashed)
      .query(`
        UPDATE Users SET 
          PasswordHash = @Hash,
          ResetToken = NULL,
          ResetTokenExpiry = NULL
        WHERE UserID = @UserID
      `);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ error: "Missing token or password" });

  try {
    await poolConnect;

    // Find user by token
    const result = await pool.request()
      .input("Token", sql.NVarChar, token)
      .query(`
        SELECT * FROM Users 
        WHERE ResetToken = @Token AND ResetTokenExpires > GETDATE()
      `);

    const user = result.recordset[0];
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.request()
      .input("UserID", sql.Int, user.UserID)
      .input("PasswordHash", sql.NVarChar, hashedPassword)
      .query(`
        UPDATE Users
        SET PasswordHash = @PasswordHash, ResetToken = NULL, ResetTokenExpires = NULL
        WHERE UserID = @UserID
      `);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET member by ID
app.get("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  await poolConnect;
  try {
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Members WHERE MemberID = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("SQL error (GET /api/members/:id):", err);
    res.status(500).send("Server error");
  }
});

// ✅ Filtered Invoice Table
app.get("/api/invoices/filter", async (req, res) => {
  const { status, memberId, startDate, endDate } = req.query;

  await poolConnect;
  try {
    let query = `
      SELECT i.InvoiceID, m.FullName, i.Amount, i.DueDate, i.IsPaid
      FROM Invoices i
      JOIN Members m ON i.MemberID = m.MemberID
      WHERE 1=1
    `;

    if (status === "paid") {
      query += " AND i.IsPaid = 1";
    } else if (status === "unpaid") {
      query += " AND i.IsPaid = 0";
    }

    if (memberId) {
      query += ` AND i.MemberID = ${memberId}`;
    }

    if (startDate && endDate) {
      query += ` AND i.DueDate BETWEEN '${startDate}' AND '${endDate}'`;
    }

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error (/invoices/filter):", err);
    res.status(500).json({ error: "Server error" });
  }
});
// ✅ Update an existing invoice
app.put("/api/invoices/:id", async (req, res) => {
  const { id } = req.params;
  const { MemberID, Amount, DueDate, Description } = req.body;

  await poolConnect;
  try {
    const result = await pool.request()
      .input("InvoiceID", sql.Int, id)
      .input("MemberID", sql.Int, MemberID)
      .input("Amount", sql.Decimal(10, 2), Amount)
      .input("DueDate", sql.Date, DueDate)
      .input("Description", sql.NVarChar, Description)
      .query(`
        UPDATE Invoices
        SET MemberID = @MemberID,
            Amount = @Amount,
            DueDate = @DueDate,
            Description = @Description
        WHERE InvoiceID = @InvoiceID
      `);

    res.status(200).json({ message: "Invoice updated successfully" });
  } catch (err) {
    console.error("SQL error (PUT /api/invoices/:id):", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET all inventory items
app.get("/api/inventory", async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query("SELECT * FROM Inventory");
    res.json(result.recordset);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ POST a new inventory item
app.post("/api/inventory", async (req, res) => {
  const { ItemName, Quantity, UnitPrice, Category, Condition } = req.body;
  const LastUpdated = new Date();

  if (!ItemName || !Quantity || !UnitPrice) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await poolConnect;
    await pool
      .request()
      .input("ItemName", sql.NVarChar, ItemName)
      .input("Quantity", sql.Int, Quantity)
      .input("UnitPrice", sql.Decimal(10, 2), UnitPrice)
      .input("Category", sql.NVarChar, Category || "")
      .input("Condition", sql.NVarChar, Condition || "")
      .input("LastUpdated", sql.DateTime, LastUpdated)
      .query(
        `INSERT INTO Inventory (ItemName, Quantity, UnitPrice, Category, Condition, LastUpdated)
         VALUES (@ItemName, @Quantity, @UnitPrice, @Category, @Condition, @LastUpdated)`
      );
    res.status(201).json({ message: "Inventory item added successfully" });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ PUT to update an item
app.put("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  const { ItemName, Quantity, UnitPrice, Category, Condition } = req.body;
  const LastUpdated = new Date();

  try {
    await poolConnect;
    await pool
      .request()
      .input("ItemID", sql.Int, id)
      .input("ItemName", sql.NVarChar, ItemName)
      .input("Quantity", sql.Int, Quantity)
      .input("UnitPrice", sql.Decimal(10, 2), UnitPrice)
      .input("Category", sql.NVarChar, Category || "")
      .input("Condition", sql.NVarChar, Condition || "")
      .input("LastUpdated", sql.DateTime, LastUpdated)
      .query(
        `UPDATE Inventory
         SET ItemName = @ItemName,
             Quantity = @Quantity,
             UnitPrice = @UnitPrice,
             Category = @Category,
             Condition = @Condition,
             LastUpdated = @LastUpdated
         WHERE ItemID = @ItemID`
      );
    res.json({ message: "Item updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ DELETE item
app.delete("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await poolConnect;
    await pool.request().input("ItemID", sql.Int, id)
      .query("DELETE FROM Inventory WHERE ItemID = @ItemID");

    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Database error" });
  }
});


app.get("/api/test-db", async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query("SELECT 1 AS Test");
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("DB test error:", err);
    res.status(500).send("DB connection failed");
  }
});
// ✅ Save Document
app.post("/api/documents", async (req, res) => {
  const { title, content, author } = req.body;
  if (!title || !content || !author) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await poolConnect;
    await pool
      .request()
      .input("Title", sql.NVarChar(255), title)
      .input("Content", sql.NVarChar(sql.MAX), content)
      .input("Author", sql.NVarChar(100), author)
      .query(
        "INSERT INTO Documents (Title, Content, Author) VALUES (@Title, @Content, @Author)"
      );

    res.json({ message: "Document saved successfully" });
  } catch (err) {
    console.error("Error saving document:", err);
    res.status(500).json({ error: "Failed to save document" });
  }
});

// ✅ Get All Documents
app.get("/api/documents", async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query("SELECT * FROM Documents ORDER BY CreatedAt DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Failed to load documents" });
  }
});
// ✅ Update a Document
app.put("/api/documents/:id", async (req, res) => {
  const { title, content } = req.body;
  const documentId = req.params.id;

  try {
    await poolConnect;
    await pool
      .request()
      .input("Title", sql.NVarChar(255), title)
      .input("Content", sql.NVarChar(sql.MAX), content)
      .input("DocumentID", sql.Int, documentId)
      .query(
        "UPDATE Documents SET Title = @Title, Content = @Content WHERE DocumentID = @DocumentID"
      );

    res.json({ message: "Document updated successfully" });
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// ✅ Delete a Document
app.delete("/api/documents/:id", async (req, res) => {
  const documentId = req.params.id;

  try {
    await poolConnect;
    await pool
      .request()
      .input("DocumentID", sql.Int, documentId)
      .query("DELETE FROM Documents WHERE DocumentID = @DocumentID");

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});
// ✅ Get all messages
app.get("/api/messages", async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query("SELECT * FROM Messages ORDER BY ScheduledAt DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Post a new message
app.post("/api/messages", async (req, res) => {
  const { title, body, recipient, scheduledAt, sentBy } = req.body;

  if (!title || !body || !recipient) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await poolConnect;

    const request = pool.request()
      .input("Title", sql.NVarChar(255), title)
      .input("Body", sql.NVarChar(sql.MAX), body)
      .input("Recipient", sql.NVarChar(255), recipient)
      .input("ScheduledAt", sql.DateTime, scheduledAt || null)
      .input("SentBy", sql.NVarChar(100), sentBy || "System");

    await request.query(`
      INSERT INTO Messages (Title, Body, Recipient, ScheduledAt, SentBy)
      VALUES (@Title, @Body, @Recipient, @ScheduledAt, @SentBy)
    `);

    res.json({ message: "Message created successfully" });
  } catch (err) {
    console.error("Insert message error:", err);
    res.status(500).json({ error: "Database error" });
  }
});
app.get("/api/users", async (req, res) => {
  await poolConnect;
  try {
    const result = await pool.request().query("SELECT * FROM Users");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Server error");
  }
});
app.post("/api/users", async (req, res) => {
  const { username, email, password, role } = req.body;
  await poolConnect;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.request()
      .input("Username", sql.NVarChar, username)
      .input("Email", sql.NVarChar, email)
      .input("Password", sql.NVarChar, hashedPassword)
      .input("Role", sql.NVarChar, role)
      .query(`INSERT INTO Users (Username, Email, Password, Role) VALUES (@Username, @Email, @Password, @Role)`);
    res.status(201).json({ message: "User added successfully" });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).send("Server error");
  }
});
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;
  await poolConnect;
  try {
    await pool.request()
      .input("UserID", sql.Int, id)
      .input("Username", sql.NVarChar, username)
      .input("Email", sql.NVarChar, email)
      .input("Role", sql.NVarChar, role)
      .query(`UPDATE Users SET Username = @Username, Email = @Email, Role = @Role WHERE UserID = @UserID`);
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send("Server error");
  }
});
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  await poolConnect;
  try {
    await pool.request()
      .input("UserID", sql.Int, id)
      .query(`DELETE FROM Users WHERE UserID = @UserID`);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Server error");
  }
});
app.get("/api/unpaid-count", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT COUNT(*) AS count FROM Members WHERE PaymentStatus = 'Unpaid'
    `);
    res.json({ count: result.recordset[0].count });
  } catch (err) {
    console.error("Error fetching unpaid count:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ✅ Upload a document file
app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { originalname, filename, path: filePath } = req.file;
  const { uploader } = req.body;

  try {
    await poolConnect;
    await pool
      .request()
      .input("Title", sql.NVarChar(255), originalname)
      .input("FilePath", sql.NVarChar(500), `/uploads/${filename}`)
      .input("Author", sql.NVarChar(100), uploader || "Unknown")
      .query(
        `INSERT INTO Documents (Title, FilePath, Author) VALUES (@Title, @FilePath, @Author)`
      );

    res.status(201).json({
      message: "File uploaded and saved",
      url: `/uploads/${filename}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to save file to DB" });
  }
});


// ✅ Get uploaded document files
app.get("/api/documents/files", async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT FileID, FileName, FilePath, UploadedBy, UploadedAt
      FROM DocumentFiles
      ORDER BY UploadedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Fetch documents error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});
