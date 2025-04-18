const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();
const port = 3000;

// Folder to store uploaded pastes
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  const content = req.file.buffer.toString("utf8");
  const name = req.body.name || `file-${Date.now()}.js`;
  const filePath = path.join(uploadsDir, name);

  fs.writeFileSync(filePath, content, "utf8");

  res.json({
    success: true,
    url: `http://localhost:${port}/raw/${name}`
  });
});

// Serve raw JS file
app.get("/raw/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found.");
  }

  res.set("Content-Type", "text/plain");
  fs.createReadStream(filePath).pipe(res);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});