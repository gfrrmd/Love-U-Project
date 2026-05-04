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

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender VARCHAR(100),
        recipient VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        spotify_url VARCHAR(255),
        spotify_track_name VARCHAR(255),
        spotify_artist VARCHAR(255),
        spotify_album_img VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("DB ready");
  } catch (e) {
    console.error("DB init error:", e.message);
  }
}

// iTunes Search API - gratis, tanpa API key
app.get("/api/music/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Query required" });
  try {
    const r = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=5`
    );
    const data = await r.json();
    const tracks = (data.results || []).map(t => ({
      id: t.trackId,
      name: t.trackName,
      artist: t.artistName,
      album_img: t.artworkUrl100,
      url: t.trackViewUrl,
    }));
    res.json(tracks);
  } catch (e) {
    console.error("iTunes search error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, sender, recipient, message, spotify_url, spotify_track_name, spotify_artist, spotify_album_img, created_at FROM messages ORDER BY created_at DESC LIMIT 20"
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

app.post("/api/messages", async (req, res) => {
  const { sender, recipient, message, spotify_url, spotify_track_name, spotify_artist, spotify_album_img } = req.body;
  if (!recipient || !message) return res.status(400).json({ error: "Recipient and message required" });
  try {
    const result = await pool.query(
      "INSERT INTO messages (sender, recipient, message, spotify_url, spotify_track_name, spotify_artist, spotify_album_img) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [sender || "Anonim", recipient, message, spotify_url || null, spotify_track_name || null, spotify_artist || null, spotify_album_img || null]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
});
