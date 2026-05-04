const BASE = "";

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    el.scrollIntoView({ behavior: "smooth" });
  }
}

function spotifyEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator` : null;
}

async function loadPreview() {
  try {
    const res = await fetch(`${BASE}/api/messages`);
    const data = await res.json();
    if (!data.length) return;

    const ticker = document.getElementById("ticker");
    const cards = [...data, ...data].map(m => {
      const sp = m.spotify_url ? `<div class="spotify-badge">🎵 Ada musik</div>` : "";
      return `<div class="letter-card">
        <div class="to">Untuk: ${m.recipient}</div>
        <div class="msg">"${m.message}"</div>
        <div class="from">— ${m.sender || "Anonim"}</div>
        ${sp}
      </div>`;
    }).join("");
    ticker.innerHTML = cards;
  } catch(e) { console.error(e); }
}

async function sendMessage() {
  const sender = document.getElementById("sender").value.trim();
  const recipient = document.getElementById("recipient").value.trim();
  const message = document.getElementById("message").value.trim();
  const spotify_url = document.getElementById("spotify").value.trim();
  const status = document.getElementById("send-status");

  if (!recipient || !message) {
    status.textContent = "⚠️ Nama penerima dan pesan wajib diisi!";
    status.className = "error";
    return;
  }

  try {
    const res = await fetch(`${BASE}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender, recipient, message, spotify_url })
    });
    const data = await res.json();
    if (data.id) {
      status.textContent = "💌 Surat terkirim! Semoga sampai ke hatinya.";
      status.className = "success";
      document.getElementById("sender").value = "";
      document.getElementById("recipient").value = "";
      document.getElementById("message").value = "";
      document.getElementById("spotify").value = "";
      loadPreview();
    } else {
      status.textContent = "❌ Gagal kirim: " + (data.error || "Unknown error");
      status.className = "error";
    }
  } catch(e) {
    status.textContent = "❌ Tidak bisa konek ke server.";
    status.className = "error";
  }
}

async function searchMessages() {
  const name = document.getElementById("search-name").value.trim();
  const container = document.getElementById("search-results");
  if (!name) return;

  container.innerHTML = '<p class="no-result">Mencari...</p>';
  try {
    const res = await fetch(`${BASE}/api/messages/${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!data.length) {
      container.innerHTML = '<p class="no-result">😔 Belum ada surat untukmu... atau mungkin sedang dalam perjalanan.</p>';
      return;
    }
    container.innerHTML = data.map(m => {
      const embed = spotifyEmbedUrl(m.spotify_url);
      const spotifyHtml = embed
        ? `<iframe style="border-radius:12px;margin-top:0.8rem" src="${embed}" width="100%" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`
        : (m.spotify_url ? `<a class="spotify-link" href="${m.spotify_url}" target="_blank">🎵 Dengarkan lagu ini</a>` : "");
      return `<div class="result-card">
        <div class="from-label">Dari: ${m.sender || "Anonim"} · ${new Date(m.created_at).toLocaleDateString("id-ID")}</div>
        <div class="msg-text">"${m.message}"</div>
        ${spotifyHtml}
      </div>`;
    }).join("");
  } catch(e) {
    container.innerHTML = '<p class="no-result">❌ Gagal memuat.</p>';
  }
}

loadPreview();
