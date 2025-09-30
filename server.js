import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const commentsFilePath = path.join(__dirname, "comments.json");
const usersFilePath = path.join(__dirname, "users.json");
const geojsonFilesDir = path.join(__dirname, "geojson_files");
const activeGeojsonFilePath = path.join(__dirname, "active_geojson.txt");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, geojsonFilesDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

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

// Delete all comments
app.delete("/api/comments", async (req, res) => {
  try {
    await fs.writeFile(commentsFilePath, "[]");
    res.json({ message: "All comments deleted successfully." });
  } catch (err) {
    console.error("Error deleting comments:", err);
    res.status(500).json({ error: "Failed to delete comments" });
  }
});

// Delete all GeoJSON files
app.delete("/api/geojson/delete-all", async (req, res) => {
  try {
    const files = await fs.readdir(geojsonFilesDir);
    const geojsonFiles = files.filter((file) => file.endsWith(".geojson"));

    for (const file of geojsonFiles) {
      await fs.unlink(path.join(geojsonFilesDir, file));
    }

    // Also delete the active_geojson.txt file
    try {
      await fs.unlink(activeGeojsonFilePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("Error deleting active_geojson.txt:", err);
      }
    }

    res.json({ message: "All GeoJSON files deleted successfully." });
  } catch (err) {
    console.error("Error deleting GeoJSON files:", err);
    res.status(500).json({ error: "Failed to delete GeoJSON files" });
  }
});

// GeoJSON Endpoints

// List available GeoJSON files
app.get("/api/geojson/list", async (req, res) => {
  try {
    const files = await fs.readdir(geojsonFilesDir);
    const geojsonFiles = files.filter((file) => file.endsWith(".geojson"));
    res.json(geojsonFiles);
  } catch (err) {
    console.error("Error listing GeoJSON files:", err);
    res.status(500).json({ error: "Failed to list GeoJSON files" });
  }
});

// Get active GeoJSON file
app.get("/api/geojson/active", async (req, res) => {
  try {
    let activeFilename = null;
    try {
      activeFilename = (
        await fs.readFile(activeGeojsonFilePath, "utf8")
      ).trim();
    } catch (err) {
      if (err.code === "ENOENT") {
        // No active file set yet, return a default or empty response
        return res.json({ filename: null, geojsonData: null });
      } else {
        throw err;
      }
    }

    const activeFilePath = path.join(geojsonFilesDir, activeFilename);
    const geojsonData = JSON.parse(await fs.readFile(activeFilePath, "utf8"));
    res.json({ filename: activeFilename, geojsonData });
  } catch (err) {
    console.error("Error fetching active GeoJSON:", err);
    res.status(500).json({ error: "Failed to fetch active GeoJSON" });
  }
});

// Set active GeoJSON file
app.post("/api/geojson/set-active", async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  const filePath = path.join(geojsonFilesDir, filename);

  try {
    // Check if file exists
    await fs.access(filePath);
    await fs.writeFile(activeGeojsonFilePath, filename);
    res.json({ message: `${filename} set as active GeoJSON` });
  } catch (err) {
    console.error("Error setting active GeoJSON:", err);
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(500).json({ error: "Failed to set active GeoJSON" });
  }
});

// Upload GeoJSON file
app.post("/api/geojson/upload", (req, res) => {
  upload.single("geojson")(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log(`File uploaded: ${req.file.originalname} to ${req.file.path}`);
    res.json({ message: `${req.file.originalname} uploaded successfully` });
  });
});

// Handle 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
