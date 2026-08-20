require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

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
        delete_password VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Add delete_password column if not exists (for existing tables)
    await pool.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS delete_password VARCHAR(64)
    `);
    console.log("DB ready");
  } catch (e) {
    console.error("DB init error:", e.message);
  }
}

// iTunes search
app.get("/api/music/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Query required" });
  try {
    const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=5`);
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
    res.status(500).json({ error: e.message });
  }
});

// GET all messages (preview ticker)
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

// GET messages by recipient - fuzzy search using ILIKE
app.get("/api/messages/search/:name", async (req, res) => {
  try {
    const name = req.params.name.trim();
    const result = await pool.query(
      `SELECT id, sender, recipient, message, spotify_url, spotify_track_name, spotify_artist, spotify_album_img, created_at
       FROM messages
       WHERE recipient ILIKE $1
       ORDER BY
         CASE WHEN LOWER(recipient) = LOWER($2) THEN 0
              WHEN LOWER(recipient) LIKE LOWER($3) THEN 1
              ELSE 2 END,
         created_at DESC`,
      [`%${name}%`, name, `${name}%`]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST send message
app.post("/api/messages", async (req, res) => {
  const { sender, recipient, message, spotify_url, spotify_track_name, spotify_artist, spotify_album_img, delete_password } = req.body;
  if (!recipient || !message) return res.status(400).json({ error: "Recipient and message required" });
  try {
    const hashedPw = delete_password ? crypto.createHash("sha256").update(delete_password).digest("hex") : null;
    const result = await pool.query(
      "INSERT INTO messages (sender, recipient, message, spotify_url, spotify_track_name, spotify_artist, spotify_album_img, delete_password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, sender, recipient, message, spotify_url, spotify_track_name, spotify_artist, spotify_album_img, created_at",
      [sender || "Anonim", recipient, message, spotify_url || null, spotify_track_name || null, spotify_artist || null, spotify_album_img || null, hashedPw]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE message with password
app.delete("/api/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });
  try {
    const check = await pool.query("SELECT delete_password FROM messages WHERE id = $1", [id]);
    if (!check.rows.length) return res.status(404).json({ error: "Surat tidak ditemukan" });
    const stored = check.rows[0].delete_password;
    if (!stored) return res.status(403).json({ error: "Surat ini tidak memiliki password hapus" });
    const hashed = crypto.createHash("sha256").update(password).digest("hex");
    if (hashed !== stored) return res.status(403).json({ error: "Password salah" });
    await pool.query("DELETE FROM messages WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
});
