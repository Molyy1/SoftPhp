const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

// === Setup SQLite DB ===
const db = new sqlite3.Database("pastes.db");
db.run(`
  CREATE TABLE IF NOT EXISTS pastes (
    id TEXT PRIMARY KEY,
    filename TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// === Upload Endpoint ===
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const id = uuidv4();
  const filename = req.body.name || `file-${Date.now()}.txt`;
  const content = req.file.buffer.toString();

  db.run(
    `INSERT INTO pastes (id, filename, content) VALUES (?, ?, ?)`,
    [id, filename, content],
    (err) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ success: false, message: "Database error", error: err.message });
      }

      res.json({
        success: true,
        url: `${req.protocol}://${req.get("host")}/raw/${id}`
      });
    }
  );
});

// === Raw file view endpoint ===
app.get("/raw/:id", (req, res) => {
  const id = req.params.id;
  db.get(`SELECT filename, content FROM pastes WHERE id = ?`, [id], (err, row) => {
    if (err || !row) {
      return res.status(404).send("File not found.");
    }

    res.set("Content-Type", "text/plain");
    res.send(row.content);
  });
});

// === Server Start ===
app.listen(port, () => {
  console.log(`Pastebin running at http://localhost:${port}`);
});
