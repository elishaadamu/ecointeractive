import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const commentsFilePath = path.join(__dirname, "comments.json");

// Get all comments
app.get("/api/comments", async (req, res) => {
  try {
    const data = await fs.readFile(commentsFilePath, "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.json([]); // Return empty array if file doesn't exist
    }
    res.status(500).json({ error: "Failed to read comments" });
  }
});

// Add a new comment
app.post("/api/comments", async (req, res) => {
  const newComment = req.body;

  try {
    let comments = [];
    try {
      const data = await fs.readFile(commentsFilePath, "utf8");
      comments = JSON.parse(data);
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    comments.push(newComment);

    await fs.writeFile(commentsFilePath, JSON.stringify(comments, null, 2));
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: "Failed to save comment" });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
