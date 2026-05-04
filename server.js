require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Init table
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender VARCHAR(100),
        recipient VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        spotify_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Database table ready");
  } catch (e) {
    console.error("DB init error:", e.message);
  }
}

// GET all messages
app.get("/api/messages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, sender, recipient, message, spotify_url, created_at FROM messages ORDER BY created_at DESC LIMIT 20"
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET messages by recipient name
app.get("/api/messages/:name", async (req, res) => {
  try {
    const name = req.params.name.toLowerCase();
    const result = await pool.query(
      "SELECT * FROM messages WHERE LOWER(recipient) = $1 ORDER BY created_at DESC",
      [name]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST send message
app.post("/api/messages", async (req, res) => {
  const { sender, recipient, message, spotify_url } = req.body;
  if (!recipient || !message) return res.status(400).json({ error: "Recipient and message are required" });
  try {
    const result = await pool.query(
      "INSERT INTO messages (sender, recipient, message, spotify_url) VALUES ($1, $2, $3, $4) RETURNING *",
      [sender || "Anonim", recipient, message, spotify_url || null]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
});
