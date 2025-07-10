// backend/routes/documents.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all documents
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Documents ORDER BY CreatedAt DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents." });
  }
});

// POST new document
router.post("/", async (req, res) => {
  const { title, content, author } = req.body;
  try {
    await db.query(
      "INSERT INTO Documents (Title, Content, Author, CreatedAt) VALUES (@title, @content, @author, GETDATE())",
      { title, content, author }
    );
    res.json({ message: "✅ Document saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save document." });
  }
});

// PUT update document
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    await db.query(
      "UPDATE Documents SET Title=@title, Content=@content WHERE DocumentID=@id",
      { id, title, content }
    );
    res.json({ message: "✅ Document updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update document." });
  }
});

// DELETE document
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM Documents WHERE DocumentID=@id", { id });
    res.json({ message: "✅ Document deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete document." });
  }
});

module.exports = router;
