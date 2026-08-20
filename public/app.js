// ===== STATE =====
let selectedTrack = null;
let currentAudio = document.getElementById('globalAudio');
let currentPlayBtn = null;

// ===== UTILS =====
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff/60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff/3600)} jam lalu`;
  return `${Math.floor(diff/86400)} hari lalu`;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== RENDER CARD =====
function renderCard(m) {
  const hasMusic = m.track_name;
  const hasPreview = m.preview_url;

  const musicHtml = hasMusic ? `
    <div class="card-music">
      ${m.track_album_img ? `<img class="music-art" src="${escHtml(m.track_album_img)}" alt="" loading="lazy" />` : ''}
      <div class="music-info">
        <div class="music-title">${escHtml(m.track_name)}</div>
        <div class="music-artist">${escHtml(m.track_artist || '')} ${m.track_url ? `— <a href="${escHtml(m.track_url)}" target="_blank" rel="noopener" style="color:var(--accent);font-size:0.72rem;">Apple Music</a>` : ''}</div>
      </div>
      ${hasPreview
        ? `<button class="btn-play" data-preview="${escHtml(m.preview_url)}" data-id="${m.id}" title="Preview 30 detik">▶</button>`
        : `<span class="no-preview-badge">No preview</span>`
      }
    </div>
  ` : '';

  return `
    <div class="menfess-card" data-id="${m.id}">
      <div class="card-meta">
        <div>
          <div class="card-from">dari <strong>${escHtml(m.sender || 'Anonim')}</strong></div>
          <div class="card-time">${timeAgo(m.created_at)}</div>
        </div>
        <div class="card-to">untuk ${escHtml(m.recipient)}</div>
      </div>
      <div class="card-message">${escHtml(m.message)}</div>
      ${musicHtml}
      <button class="btn-delete" data-id="${m.id}" title="Hapus">🗑 hapus</button>
    </div>
  `;
}

// ===== LOAD FEED =====
async function loadFeed(searchName = '') {
  const list = document.getElementById('menfessList');
  const loading = document.getElementById('loadingFeed');
  const empty = document.getElementById('emptyFeed');
  const title = document.getElementById('feedTitle');

  list.innerHTML = '';
  loading.style.display = 'block';
  empty.style.display = 'none';

  const url = searchName
    ? `/api/menfess/search/${encodeURIComponent(searchName)}`
    : '/api/menfess';

  title.textContent = searchName
    ? `🔍 Menfess untuk "${searchName}"`
    : '✨ Semua Menfess';

  try {
    const res = await fetch(url);
    const data = await res.json();
    loading.style.display = 'none';
    if (!data.length) { empty.style.display = 'block'; return; }
    list.innerHTML = data.map(renderCard).join('');
    attachPlayButtons();
    attachDeleteButtons();
  } catch {
    loading.textContent = 'Gagal memuat 😢';
  }
}

// ===== AUDIO PLAYER =====
function attachPlayButtons() {
  document.querySelectorAll('.btn-play').forEach(btn => {
    btn.addEventListener('click', () => {
      const previewUrl = btn.dataset.preview;
      if (!previewUrl) return;

      // Same track = toggle
      if (currentPlayBtn === btn) {
        if (currentAudio.paused) {
          currentAudio.play();
          btn.textContent = '⏸';
          btn.classList.add('playing');
        } else {
          currentAudio.pause();
          btn.textContent = '▶';
          btn.classList.remove('playing');
        }
        return;
      }

      // Different track — stop old
      if (currentPlayBtn) {
        currentPlayBtn.textContent = '▶';
        currentPlayBtn.classList.remove('playing');
      }
      currentAudio.pause();
      currentAudio.src = previewUrl;
      currentAudio.play().then(() => {
        btn.textContent = '⏸';
        btn.classList.add('playing');
        currentPlayBtn = btn;
      }).catch(() => {
        btn.textContent = '▶';
        btn.classList.remove('playing');
      });
    });
  });

  currentAudio.addEventListener('ended', () => {
    if (currentPlayBtn) {
      currentPlayBtn.textContent = '▶';
      currentPlayBtn.classList.remove('playing');
      currentPlayBtn = null;
    }
  });
}

// ===== DELETE =====
function attachDeleteButtons() {
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const pw = prompt('Masukkan password hapus:');
      if (!pw) return;
      const res = await fetch(`/api/menfess/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.success) {
        document.querySelector(`.menfess-card[data-id="${id}"]`)?.remove();
      } else {
        alert(data.error || 'Gagal hapus');
      }
    });
  });
}

// ===== MUSIC SEARCH (in form) =====
async function searchMusic(q) {
  const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

function renderMusicResults(tracks) {
  const container = document.getElementById('musicResults');
  if (!tracks.length) { container.innerHTML = '<div style="font-size:0.82rem;color:var(--text2);padding:6px 0">Lagu tidak ditemukan 🎵</div>'; return; }
  container.innerHTML = tracks.map(t => `
    <div class="music-result-item" data-track='${JSON.stringify(t)}'>
      ${t.album_img ? `<img src="${escHtml(t.album_img)}" alt="" />` : ''}
      <div>
        <div class="ri-name">${escHtml(t.name)}</div>
        <div class="ri-artist">${escHtml(t.artist)}</div>
      </div>
      ${t.preview_url ? '<span class="ri-preview">▶ preview</span>' : ''}
    </div>
  `).join('');

  container.querySelectorAll('.music-result-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedTrack = JSON.parse(item.dataset.track);
      document.getElementById('musicResults').innerHTML = '';
      document.getElementById('musicSearch').value = '';
      showSelectedTrack();
    });
  });
}

function showSelectedTrack() {
  const el = document.getElementById('selectedTrack');
  if (!selectedTrack) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = `
    ${selectedTrack.album_img ? `<img src="${escHtml(selectedTrack.album_img)}" alt="" />` : ''}
    <div class="st-info">
      <div class="st-name">${escHtml(selectedTrack.name)}</div>
      <div class="st-artist">${escHtml(selectedTrack.artist)}</div>
    </div>
    <button class="st-remove" title="Hapus pilihan">✕</button>
  `;
  el.querySelector('.st-remove').addEventListener('click', () => {
    selectedTrack = null;
    el.style.display = 'none';
  });
}

// ===== SUBMIT FORM =====
document.getElementById('menfessForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  const err = document.getElementById('formError');
  err.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Mengirim...';

  const body = {
    sender: document.getElementById('fSender').value.trim() || 'Anonim',
    recipient: document.getElementById('fRecipient').value.trim(),
    message: document.getElementById('fMessage').value.trim(),
    delete_password: document.getElementById('fPassword').value || null,
    track_name: selectedTrack?.name || null,
    track_artist: selectedTrack?.artist || null,
    track_album_img: selectedTrack?.album_img || null,
    track_url: selectedTrack?.url || null,
    preview_url: selectedTrack?.preview_url || null,
  };

  try {
    const res = await fetch('/api/menfess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal kirim');

    // Reset form
    document.getElementById('menfessForm').reset();
    selectedTrack = null;
    document.getElementById('selectedTrack').style.display = 'none';
    document.getElementById('charCount').textContent = '0/500';
    closeModal();
    loadFeed();
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirim Menfess 💌';
  }
});

// ===== CHAR COUNT =====
document.getElementById('fMessage').addEventListener('input', function() {
  document.getElementById('charCount').textContent = `${this.value.length}/500`;
});

// ===== MODAL =====
function openModal() { document.getElementById('modalOverlay').classList.add('open'); }
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('btnOpenForm').addEventListener('click', openModal);
document.getElementById('btnCloseForm').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ===== SEARCH =====
document.getElementById('btnSearch').addEventListener('click', () => {
  const q = document.getElementById('searchInput').value.trim();
  loadFeed(q);
});
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnSearch').click();
});

// ===== MUSIC SEARCH BUTTON =====
document.getElementById('btnMusicSearch').addEventListener('click', async () => {
  const q = document.getElementById('musicSearch').value.trim();
  if (!q) return;
  const tracks = await searchMusic(q);
  renderMusicResults(tracks);
});
document.getElementById('musicSearch').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btnMusicSearch').click(); }
});

// ===== INIT =====
loadFeed();
