// Theme
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

(function() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('themeBtn').textContent = saved === 'dark' ? '🌙' : '☀️';
  });
})();

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); el.scrollIntoView({ behavior: 'smooth' }); }
}

// Spotify search
let searchTimer = null;
function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(searchSpotify, 500);
}

async function searchSpotify() {
  const q = document.getElementById('spotify-query').value.trim();
  const dropdown = document.getElementById('spotify-results');
  if (!q) { dropdown.classList.add('hidden'); return; }

  dropdown.innerHTML = '<div class="spotify-item"><div class="spotify-item-info"><div class="spotify-item-name">Mencari...</div></div></div>';
  dropdown.classList.remove('hidden');

  try {
    const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
    const tracks = await res.json();
    if (!tracks.length) {
      dropdown.innerHTML = '<div class="spotify-item"><div class="spotify-item-info"><div class="spotify-item-name">Tidak ditemukan</div></div></div>';
      return;
    }
    dropdown.innerHTML = tracks.map(t => `
      <div class="spotify-item" onclick="selectTrack('${t.url}','${escHtml(t.name)}','${escHtml(t.artist)}','${t.album_img}')">
        <img src="${t.album_img}" alt="" />
        <div class="spotify-item-info">
          <div class="spotify-item-name">${t.name}</div>
          <div class="spotify-item-artist">${t.artist}</div>
        </div>
      </div>
    `).join('');
  } catch(e) {
    dropdown.innerHTML = '<div class="spotify-item"><div class="spotify-item-info"><div class="spotify-item-name">Gagal memuat</div></div></div>';
  }
}

function escHtml(str) {
  return str.replace(/'/g, "&#39;").replace(/"/g, '&quot;');
}

function selectTrack(url, name, artist, img) {
  document.getElementById('spotify-url').value = url;
  document.getElementById('spotify-track-name').value = name;
  document.getElementById('spotify-artist').value = artist;
  document.getElementById('spotify-album-img').value = img;
  document.getElementById('spotify-query').value = '';
  document.getElementById('spotify-results').classList.add('hidden');

  document.getElementById('sel-img').src = img;
  document.getElementById('sel-name').textContent = name;
  document.getElementById('sel-artist').textContent = artist;
  document.getElementById('spotify-selected').classList.remove('hidden');
}

function clearSpotify() {
  ['spotify-url','spotify-track-name','spotify-artist','spotify-album-img'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('spotify-selected').classList.add('hidden');
  document.getElementById('spotify-query').value = '';
}

// Preview ticker
async function loadPreview() {
  try {
    const res = await fetch('/api/messages');
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return;

    const ticker = document.getElementById('ticker');
    const makeCard = (m) => {
      const sp = m.spotify_album_img ? `
        <div class="card-spotify-mini">
          <img src="${m.spotify_album_img}" alt="" />
          <div class="card-spotify-text">
            <div class="card-spotify-title">${m.spotify_track_name || ''}</div>
            <div class="card-spotify-artist">${m.spotify_artist || ''}</div>
          </div>
        </div>` : '';
      return `<div class="letter-card">
        <div>
          <div class="card-to">Untuk: ${m.recipient}</div>
          <div class="card-msg">${m.message}</div>
        </div>
        <div>
          <div class="card-from">— ${m.sender || 'Anonim'}</div>
          ${sp}
        </div>
      </div>`;
    };
    ticker.innerHTML = [...data, ...data].map(makeCard).join('');
  } catch(e) { console.error(e); }
}

// Send
async function sendMessage() {
  const sender = document.getElementById('sender').value.trim();
  const recipient = document.getElementById('recipient').value.trim();
  const message = document.getElementById('message').value.trim();
  const spotify_url = document.getElementById('spotify-url').value;
  const spotify_track_name = document.getElementById('spotify-track-name').value;
  const spotify_artist = document.getElementById('spotify-artist').value;
  const spotify_album_img = document.getElementById('spotify-album-img').value;
  const status = document.getElementById('send-status');
  const btn = document.getElementById('sendBtn');

  if (!recipient || !message) {
    status.textContent = 'Nama penerima dan pesan wajib diisi.';
    status.className = 'error';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Mengirim...';
  status.textContent = ''; status.className = '';

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, recipient, message, spotify_url, spotify_track_name, spotify_artist, spotify_album_img })
    });
    const data = await res.json();
    if (data.id) {
      status.textContent = 'Surat terkirim!';
      status.className = 'success';
      document.getElementById('sender').value = '';
      document.getElementById('recipient').value = '';
      document.getElementById('message').value = '';
      clearSpotify();
      loadPreview();
    } else {
      status.textContent = 'Gagal: ' + (data.error || 'Unknown error');
      status.className = 'error';
    }
  } catch(e) {
    status.textContent = 'Tidak bisa konek ke server.';
    status.className = 'error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirim Sekarang';
  }
}

// Search
async function searchMessages() {
  const name = document.getElementById('search-name').value.trim();
  const container = document.getElementById('search-results');
  if (!name) return;

  container.innerHTML = '<p class="no-result">Mencari...</p>';
  try {
    const res = await fetch(`/api/messages/${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) {
      container.innerHTML = '<p class="no-result">Belum ada surat untukmu.</p>';
      return;
    }
    container.innerHTML = data.map(m => {
      const spotifyHtml = m.spotify_album_img
        ? `<a class="result-spotify" href="${m.spotify_url}" target="_blank">
            <img src="${m.spotify_album_img}" alt="" />
            <div class="result-spotify-info">
              <span class="result-spotify-name">${m.spotify_track_name}</span>
              <span class="result-spotify-artist">${m.spotify_artist}</span>
            </div>
           </a>`
        : '';
      return `<div class="result-card">
        <div class="result-from">Dari: ${m.sender || 'Anonim'} · ${new Date(m.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</div>
        <div class="result-msg">${m.message}</div>
        ${spotifyHtml}
      </div>`;
    }).join('');
  } catch(e) {
    container.innerHTML = '<p class="no-result">Gagal memuat.</p>';
  }
}

loadPreview();
