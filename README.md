# 💌 Mystery Message

Website untuk kirim pesan anonim ke siapa saja — bisa ditambahkan lagu Spotify, lalu bagikan linknya biar si penerima bisa nemuin suratnya!

## ✨ Fitur

- Kirim pesan rahasia secara anonim
- Tambahkan lagu Spotify ke pesanmu
- Buat link unik untuk dikirim ke penerima
- Tampilan simpel dan bersih

## 🛠️ Teknologi yang Digunakan

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Deploy**: Railway (pakai Nixpacks)

## 🚀 Menjalankan di Lokal

### Yang Dibutuhkan

- Node.js v18 ke atas
- Database PostgreSQL

### Langkah-langkah

**1. Clone repo ini**
```bash
git clone https://github.com/gfrrmd/mystery-message.git
cd mystery-message
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

| Variabel       | Keterangan                                      |
|----------------|-------------------------------------------------|
| `DATABASE_URL` | URL koneksi ke database PostgreSQL kamu         |
| `NODE_ENV`     | Isi `development` untuk lokal, `production` untuk deploy |
| `PORT`         | Port yang dipakai server (default: 3000)        |

**4. Jalankan aplikasinya**
```bash
npm start
```

Buka browser dan akses `http://localhost:3000`.

---

## ☁️ Cara Deploy ke Railway

[Railway](https://railway.app) adalah platform cloud yang gampang dipakai buat deploy aplikasi Node.js. Proyek ini sudah include file `railway.json` dan `nixpacks.toml`, jadi proses deploy-nya tinggal ikutin langkah berikut.

**1. Buat akun Railway**

Daftar di [railway.app](https://railway.app) — bisa pakai akun GitHub langsung.

**2. Buat project baru**

- Klik **New Project** → **Deploy from GitHub repo**
- Hubungkan akun GitHub kamu kalau belum
- Pilih repo `mystery-message`

**3. Tambahkan database PostgreSQL**

- Di dalam project Railway, klik **New** → **Database** → **Add PostgreSQL**
- Railway akan otomatis bikin database buat kamu

**4. Atur environment variables**

- Masuk ke service kamu → tab **Variables**
- Tambahkan variabel berikut:

| Variabel       | Nilai                                                    |
|----------------|----------------------------------------------------------|
| `DATABASE_URL` | Salin dari tab **Connect** di service PostgreSQL         |
| `NODE_ENV`     | `production`                                             |
| `PORT`         | `3000`                                                   |

> 💡 **Tips:** Kalau kamu menghubungkan service PostgreSQL ke service app-nya di Railway, `DATABASE_URL` akan otomatis terisi sendiri.

**5. Deploy!**

Railway akan otomatis build dan deploy aplikasinya. Setelah selesai, kamu akan dapat URL publik seperti:
```
https://mystery-message-xxxx.up.railway.app
```

**6. Auto deploy setiap push**

Setiap kali kamu push ke branch `main`, Railway akan otomatis deploy ulang aplikasinya.

---

## 📄 Lisensi

MIT
