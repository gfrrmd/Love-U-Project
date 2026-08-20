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
      CREATE TABLE IF NOT EXISTS menfess (
        id SERIAL PRIMARY KEY,
        sender VARCHAR(100) DEFAULT 'Anonim',
        recipient VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        track_name VARCHAR(255),
        track_artist VARCHAR(255),
        track_album_img VARCHAR(255),
        track_url VARCHAR(255),
        preview_url VARCHAR(255),
        delete_password VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("DB ready");
  } catch (e) {
    console.error("DB init error:", e.message);
  }
}

// iTunes search — now includes previewUrl
app.get("/api/music/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Query required" });
  try {
    const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=6`);
    const data = await r.json();
    const tracks = (data.results || []).map(t => ({
      id: t.trackId,
      name: t.trackName,
      artist: t.artistName,
      album_img: t.artworkUrl100,
      url: t.trackViewUrl,
      preview_url: t.previewUrl || null,
    }));
    res.json(tracks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all menfess (feed publik)
app.get("/api/menfess", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, sender, recipient, message, track_name, track_artist, track_album_img, track_url, preview_url, created_at
       FROM menfess ORDER BY created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET menfess by recipient (search)
app.get("/api/menfess/search/:name", async (req, res) => {
  try {
    const name = req.params.name.trim();
    const result = await pool.query(
      `SELECT id, sender, recipient, message, track_name, track_artist, track_album_img, track_url, preview_url, created_at
       FROM menfess
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

// POST kirim menfess
app.post("/api/menfess", async (req, res) => {
  const { sender, recipient, message, track_name, track_artist, track_album_img, track_url, preview_url, delete_password } = req.body;
  if (!recipient || !message) return res.status(400).json({ error: "Recipient dan message wajib diisi" });
  try {
    const hashedPw = delete_password ? crypto.createHash("sha256").update(delete_password).digest("hex") : null;
    const result = await pool.query(
      `INSERT INTO menfess (sender, recipient, message, track_name, track_artist, track_album_img, track_url, preview_url, delete_password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, sender, recipient, message, track_name, track_artist, track_album_img, track_url, preview_url, created_at`,
      [sender || "Anonim", recipient, message, track_name || null, track_artist || null, track_album_img || null, track_url || null, preview_url || null, hashedPw]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE menfess dengan password
app.delete("/api/menfess/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });
  try {
    const check = await pool.query("SELECT delete_password FROM menfess WHERE id = $1", [id]);
    if (!check.rows.length) return res.status(404).json({ error: "Menfess tidak ditemukan" });
    const stored = check.rows[0].delete_password;
    if (!stored) return res.status(403).json({ error: "Menfess ini tidak memiliki password hapus" });
    const hashed = crypto.createHash("sha256").update(password).digest("hex");
    if (hashed !== stored) return res.status(403).json({ error: "Password salah" });
    await pool.query("DELETE FROM menfess WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
});
