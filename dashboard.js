let allClips = [];
let activeDomain = null;
let fontSize  = localStorage.getItem('pcz-fs')      || '13';
let theme     = localStorage.getItem('pcz-theme')   || 'light';
let cardOp    = localStorage.getItem('pcz-card-op') || '100';

const sizeMap = { '11': '11px', '13': '13px', '16': '16px' };

const MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SUN  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

function applyTheme() {
  document.body.classList.toggle('dark', theme === 'dark');
  document.getElementById('themeBtn').innerHTML = theme === 'dark' ? SUN : MOON;
  document.getElementById('themeBtn').title = theme === 'dark' ? 'Switch to light' : 'Switch to dark';
}

function applySize() {
  document.body.style.setProperty('--txt-size', sizeMap[fontSize] || '13px');
  document.querySelectorAll('.sz-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.sz === fontSize)
  );
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function domain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
  } catch { return '#'; }
}

function getVisible() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  return allClips.filter(c => {
    const domainMatch = !activeDomain || domain(c.url) === activeDomain;
    const textMatch = !q ||
      c.title.toLowerCase().includes(q) ||
      c.url.toLowerCase().includes(q) ||
      (c.text && c.text.toLowerCase().includes(q)) ||
      (c.note && c.note.toLowerCase().includes(q));
    return domainMatch && textMatch;
  });
}

function renderFilters() {
  const counts = {};
  allClips.forEach(c => { const d = domain(c.url); counts[d] = (counts[d] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 14);
  const filters = document.getElementById('filters');
  if (!sorted.length) { filters.style.display = 'none'; return; }
  filters.style.display = '';
  filters.innerHTML =
    `<button class="chip ${!activeDomain ? 'active' : ''}" data-domain="">All</button>` +
    sorted.map(([d, n]) =>
      `<button class="chip ${activeDomain === d ? 'active' : ''}" data-domain="${esc(d)}">${esc(d)} <span style="opacity:.5">${n}</span></button>`
    ).join('');
}

function renderGrid() {
  const clips = getVisible();
  const grid = document.getElementById('grid');
  document.getElementById('count').textContent =
    clips.length ? `${clips.length} clip${clips.length !== 1 ? 's' : ''}` : '';

  if (!clips.length) {
    const q = document.getElementById('searchInput').value.trim();
    grid.innerHTML = `<div class="empty-state">${q || activeDomain
      ? 'No clips match.'
      : 'Nothing saved yet.<br>Use the 📎 button on any page to save selections.'
    }</div>`;
    return;
  }

  grid.innerHTML = clips.map(c => `
    <div class="card" data-id="${esc(c.id)}">
      <div class="card-header">
        <span class="card-domain">${esc(domain(c.url))}</span>
        <span class="card-time">${relativeTime(c.ts)}</span>
      </div>
      <a class="card-title" href="${safeUrl(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a>
      ${c.text ? `
        <div class="card-text-wrap">
          <div class="card-text">${esc(c.text)}</div>
          <button class="expand-btn" data-expanded="false">
            <span class="exp-arrow">↓</span><span class="exp-label" hidden></span>
          </button>
        </div>` : ''}
      ${c.note ? `<div class="card-note">📝 ${esc(c.note)}</div>` : ''}
      <div class="card-footer">
        <button class="copy-btn" data-id="${esc(c.id)}">Copy</button>
        <button class="del-btn" data-id="${esc(c.id)}">×</button>
      </div>
    </div>
  `).join('');
}

function render() { renderFilters(); renderGrid(); }

function applyCardOp() {
  const val = (parseInt(cardOp) / 100).toFixed(2);
  document.documentElement.style.setProperty('--card-op', val);
  document.getElementById('opSlider').value = cardOp;
}

// ── Init ──
applyTheme();
applySize();
applyCardOp();

chrome.storage.local.get({ clips: [] }, ({ clips }) => { allClips = clips; render(); });

chrome.storage.onChanged.addListener((changes) => {
  if (changes.clips) { allClips = changes.clips.newValue || []; render(); }
});

// ── Theme toggle ──
document.getElementById('themeBtn').addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('pcz-theme', theme);
  applyTheme();
});

// ── Export ──
document.getElementById('exportBtn').addEventListener('click', () => {
  const data = JSON.stringify(allClips, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `paper-clipz-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── Import ──
document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error('Not an array');
      const valid = imported.filter(c => c && typeof c === 'object' && c.id);
      chrome.storage.local.get({ clips: [] }, ({ clips }) => {
        const existingIds = new Set(clips.map(c => c.id));
        const merged = [...clips, ...valid.filter(c => !existingIds.has(c.id))];
        chrome.storage.local.set({ clips: merged }, () => {
          allClips = merged;
          render();
          const btn = document.getElementById('importBtn');
          const orig = btn.textContent;
          btn.textContent = `↑ +${valid.length} imported`;
          setTimeout(() => { btn.textContent = orig; }, 2000);
        });
      });
    } catch {
      alert('Invalid JSON file — could not import.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ── Card transparency ──
document.getElementById('opSlider').addEventListener('input', e => {
  cardOp = e.target.value;
  localStorage.setItem('pcz-card-op', cardOp);
  applyCardOp();
});

// ── Font size ──
document.querySelectorAll('.sz-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    fontSize = btn.dataset.sz;
    localStorage.setItem('pcz-fs', fontSize);
    applySize();
  });
});

// ── Search ──
document.getElementById('searchInput').addEventListener('input', renderGrid);

// ── Domain filter ──
document.getElementById('filters').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activeDomain = chip.dataset.domain || null;
  render();
});

// ── Grid interactions ──
const grid = document.getElementById('grid');

grid.addEventListener('mouseover', e => {
  const btn = e.target.closest('.expand-btn');
  if (!btn) return;
  btn.querySelector('.exp-arrow').hidden = true;
  const lbl = btn.querySelector('.exp-label');
  lbl.textContent = btn.dataset.expanded === 'true' ? 'Collapse' : 'Expand';
  lbl.hidden = false;
});

grid.addEventListener('mouseout', e => {
  const btn = e.target.closest('.expand-btn');
  if (!btn) return;
  btn.querySelector('.exp-arrow').hidden = false;
  btn.querySelector('.exp-label').hidden = true;
});

grid.addEventListener('click', e => {
  const expandBtn = e.target.closest('.expand-btn');
  if (expandBtn) {
    const card = expandBtn.closest('.card');
    const isExp = expandBtn.dataset.expanded === 'true';
    expandBtn.dataset.expanded = String(!isExp);
    card.querySelector('.card-text').classList.toggle('expanded', !isExp);
    expandBtn.querySelector('.exp-arrow').textContent = !isExp ? '↑' : '↓';
    const lbl = expandBtn.querySelector('.exp-label');
    if (!lbl.hidden) lbl.textContent = !isExp ? 'Collapse' : 'Expand';
    return;
  }

  const copyBtn = e.target.closest('.copy-btn');
  if (copyBtn) {
    const card = copyBtn.closest('.card');
    const textEl = card.querySelector('.card-text');
    if (textEl) {
      const range = document.createRange();
      range.selectNodeContents(textEl);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
    const clip = allClips.find(c => c.id === copyBtn.dataset.id);
    if (clip) {
      navigator.clipboard.writeText([clip.text, clip.note].filter(Boolean).join('\n\n'));
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('done');
      setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('done'); }, 1500);
    }
    return;
  }

  const delBtn = e.target.closest('.del-btn');
  if (delBtn) {
    allClips = allClips.filter(c => c.id !== delBtn.dataset.id);
    chrome.storage.local.set({ clips: allClips });
    render();
  }
});
