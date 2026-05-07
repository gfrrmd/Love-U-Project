# 💌 Love U Project

Website untuk kirim pesan anonim ke siapa saja — bisa ditambahkan lagu dari iTunes, lalu bagikan linknya biar si penerima bisa nemuin suratnya. Pesanmu bisa dihapus kapan saja pakai password yang kamu buat sendiri.

## ✨ Fitur

- Kirim pesan rahasia secara anonim (atau pakai nama)
- Cari dan lampirkan lagu dari **iTunes** ke pesanmu
- Cari pesan berdasarkan nama penerima (fuzzy search)
- Hapus pesan kapan saja pakai **password unik** (di-hash SHA-256)
- Tampilan 20 pesan terbaru di halaman utama
- Health check endpoint (`/health`)

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Database | PostgreSQL |
| Music API | iTunes Search API (gratis, tanpa API key) |
| Deploy | Railway (Nixpacks) |

## 🚀 Menjalankan di Lokal

### Yang Dibutuhkan

- Node.js v18 ke atas
- Database PostgreSQL (bisa pakai Railway, Supabase, atau lokal)

### Langkah-langkah

**1. Clone repo ini**
```bash
git clone https://github.com/gfrrmd/Love-U-Project.git
cd Love-U-Project
```

**2. Install semua dependensi**
```bash
npm install
```

**3. Buat file `.env`**

Salin file contohnya dulu:
```bash
cp .env.example .env
```

Lalu isi nilainya:

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | URL koneksi ke database PostgreSQL kamu |
| `NODE_ENV` | Isi `development` untuk lokal, `production` untuk deploy |
| `PORT` | Port yang dipakai server (default: `3000`) |

**4. Jalankan aplikasinya**
```bash
npm start
```

Buka browser dan akses `http://localhost:3000`.

---

## ☁️ Deploy ke Railway

[Railway](https://railway.app) adalah platform cloud yang gampang dipakai buat deploy aplikasi Node.js. Repo ini sudah include file `railway.json` dan `nixpacks.toml`, jadi deploy-nya cukup beberapa langkah.

**1. Buat akun Railway**

Daftar di [railway.app](https://railway.app) — bisa langsung pakai akun GitHub.

**2. Buat project baru**

- Klik **New Project** → **Deploy from GitHub repo**
- Hubungkan akun GitHub kamu kalau belum
- Pilih repo **Love-U-Project**

**3. Tambahkan database PostgreSQL**

- Di dalam project Railway, klik **New** → **Database** → **Add PostgreSQL**
- Railway akan otomatis membuat database untukmu

**4. Atur environment variables**

Masuk ke service app → tab **Variables**, lalu tambahkan:

| Variabel | Nilai |
|---|---|
| `DATABASE_URL` | Salin dari tab **Connect** di service PostgreSQL |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

> 💡 **Tips:** Kalau kamu link service PostgreSQL ke service app di Railway, variabel `DATABASE_URL` akan **otomatis terisi** — kamu tidak perlu isi manual.

**5. Deploy!**

Railway akan otomatis build dan deploy aplikasinya menggunakan Nixpacks. Setelah selesai, kamu akan mendapat URL publik seperti:
```
https://love-u-project-xxxx.up.railway.app
```

**6. Auto deploy setiap push**

Setiap kali kamu push ke branch `main`, Railway akan otomatis deploy ulang aplikasinya tanpa perlu langkah tambahan.

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/messages` | Ambil 20 pesan terbaru |
| `GET` | `/api/messages/search/:name` | Cari pesan berdasarkan nama penerima |
| `POST` | `/api/messages` | Kirim pesan baru |
| `DELETE` | `/api/messages/:id` | Hapus pesan dengan password |
| `GET` | `/api/music/search?q=` | Cari lagu via iTunes |
| `GET` | `/health` | Health check |

### Contoh body POST `/api/messages`
```json
{
  "sender": "Anonim",
  "recipient": "Nama Penerima",
  "message": "Isi pesanmu di sini",
  "spotify_url": "https://music.apple.com/...",
  "spotify_track_name": "Judul Lagu",
  "spotify_artist": "Nama Artis",
  "spotify_album_img": "https://...",
  "delete_password": "passwordRahasia123"
}
```

> ℹ️ Field `sender` dan semua field musik bersifat opsional. Jika `delete_password` diisi, pesan hanya bisa dihapus menggunakan password tersebut.

---

## 📄 Lisensi

MIT
