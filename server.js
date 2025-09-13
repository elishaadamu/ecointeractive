import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const commentsFilePath = path.join(__dirname, "comments.json");
const usersFilePath = path.join(__dirname, "users.json");

app.get("/", (req, res) => {
  res.json({ message: "Cannot GET" });
});

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const data = await fs.readFile(usersFilePath, "utf8");
    const users = JSON.parse(data);
    const user = users.find((u) => u.email === email);

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ message: "Login successful!" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to process login" });
  }
});

// Get all comments
app.get("/api/comments", async (req, res) => {
  try {
    const data = await fs.readFile(commentsFilePath, "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.json([]); // Return empty array if file doesn't exist
    }
    console.error("Error reading comments file:", err);
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

// Handle 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
