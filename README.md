# 💌 Mystery Message

A web application that lets you send anonymous mystery messages, attach a Spotify track, and share a unique link so the recipient can find their letter.

## ✨ Features

- Send anonymous messages with a personal touch
- Attach a Spotify song to your message
- Generate a unique shareable link for the recipient
- Clean and minimal UI

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Deployment**: Railway (with Nixpacks)

## 🚀 Getting Started (Local Development)

### Prerequisites

- Node.js v18+
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gfrrmd/mystery-message.git
   cd mystery-message
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   | Variable       | Description                          |
   |----------------|--------------------------------------|
   | `DATABASE_URL` | PostgreSQL connection string         |
   | `NODE_ENV`     | Set to `development` or `production` |
   | `PORT`         | Port the server runs on (default: 3000) |

4. **Run the app**
   ```bash
   npm start
   ```

   The app will be available at `http://localhost:3000`.

---

## ☁️ Deploy to Railway

[Railway](https://railway.app) is a cloud platform that makes deploying Node.js apps simple. This project already includes a `railway.json` and `nixpacks.toml` config, so deployment is straightforward.

### Step-by-step

1. **Create a Railway account**

   Go to [railway.app](https://railway.app) and sign up (you can use your GitHub account).

2. **Create a new project**

   - Click **New Project** → **Deploy from GitHub repo**
   - Connect your GitHub account if not already connected
   - Select the `mystery-message` repository

3. **Add a PostgreSQL database**

   - Inside your Railway project, click **New** → **Database** → **Add PostgreSQL**
   - Railway will automatically provision a PostgreSQL instance

4. **Set environment variables**

   - Go to your service → **Variables** tab
   - Add the following variables:

   | Variable       | Value                                              |
   |----------------|----------------------------------------------------|
   | `DATABASE_URL` | Copy from the PostgreSQL service's **Connect** tab |
   | `NODE_ENV`     | `production`                                       |
   | `PORT`         | `3000`                                             |

   > 💡 Tip: Railway automatically injects `DATABASE_URL` if you link the PostgreSQL service to your app service.

5. **Deploy**

   Railway will automatically build and deploy your app using Nixpacks. Once the build finishes, you'll get a public URL like:
   ```
   https://mystery-message-xxxx.up.railway.app
   ```

6. **Re-deploy on push**

   Every time you push to your `main` branch, Railway will automatically trigger a new deployment.

---

## 📄 License

MIT
