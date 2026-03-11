import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import multer from "multer";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file");
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));
}

// Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const commentSchema = new mongoose.Schema({
  username: String,
  comment: String,
  timestamp: { type: Date, default: Date.now },
  projectId: String,
  projectTitle: String
}, { strict: false }); // Allow any structure for comments

const projectSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  isActive: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Comment = mongoose.model("Comment", commentSchema);
const Project = mongoose.model("Project", projectSchema);

// Multer storage in memory for GeoJSON upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Migration helper (One-time check to ensure the admin user exists)
const seedAdmin = async () => {
  try {
    const adminEmail = "zmumuni.da@gmail.com";
    const existingUser = await User.findOne({ email: adminEmail });
    if (!existingUser) {
      // Use the hashed password from your users.json if you want to keep it same
      // Or create a new one. Since the user already has one, let's use it.
      await User.create({
        email: adminEmail,
        password: "$2b$10$Nfx5dFzKDAn5BTdI/6ewr.P5uv/aT1cY64uZqIsv9WjZjpfwHEX8a"
      });
      console.log("Admin user seeded.");
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
};
seedAdmin();

app.get("/", (req, res) => {
  res.json({ message: "Zakari API is running" });
});

// Login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

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
    const comments = await Comment.find().sort({ timestamp: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to read comments" });
  }
});

// Add a new comment
app.post("/api/comments", async (req, res) => {
  try {
    const newComment = await Comment.create(req.body);
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: "Failed to save comment" });
  }
});

// Delete all comments
app.delete("/api/comments", async (req, res) => {
  try {
    await Comment.deleteMany({});
    res.json({ message: "All comments deleted successfully." });
  } catch (err) {
    console.error("Error deleting comments:", err);
    res.status(500).json({ error: "Failed to delete comments" });
  }
});

// Delete all Projects (GeoJSON)
app.delete("/api/geojson/delete-all", async (req, res) => {
  try {
    await Project.deleteMany({});
    res.json({ message: "All GeoJSON records deleted successfully." });
  } catch (err) {
    console.error("Error deleting GeoJSON records:", err);
    res.status(500).json({ error: "Failed to delete GeoJSON records" });
  }
});

// List available GeoJSON files
app.get("/api/geojson/list", async (req, res) => {
  try {
    const projects = await Project.find({}, "filename");
    res.json(projects.map(p => p.filename));
  } catch (err) {
    console.error("Error listing GeoJSON files:", err);
    res.status(500).json({ error: "Failed to list GeoJSON files" });
  }
});

// Get active GeoJSON file
app.get("/api/geojson/active", async (req, res) => {
  try {
    const activeProject = await Project.findOne({ isActive: true });
    if (!activeProject) {
      return res.json({ filename: null, geojsonData: null });
    }
    res.json({ filename: activeProject.filename, geojsonData: activeProject.data });
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

  try {
    // Set all to inactive
    await Project.updateMany({}, { isActive: false });
    // Set the chosen one to active
    const result = await Project.findOneAndUpdate(
      { filename },
      { isActive: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: `${filename} set as active GeoJSON` });
  } catch (err) {
    console.error("Error setting active GeoJSON:", err);
    res.status(500).json({ error: "Failed to set active GeoJSON" });
  }
});

// Upload GeoJSON file
app.post("/api/geojson/upload", upload.single("geojson"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const geojsonData = JSON.parse(req.file.buffer.toString());
    const filename = req.file.originalname;

    // Save or Update in MongoDB
    await Project.findOneAndUpdate(
      { filename },
      { data: geojsonData, uploadedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`File uploaded to MongoDB: ${filename}`);
    res.json({ message: `${filename} uploaded successfully to database` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload GeoJSON" });
  }
});

// Handle 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
