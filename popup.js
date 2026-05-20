const saveBtn = document.getElementById('saveBtn');
const dashBtn = document.getElementById('dashBtn');
const urlOpen = document.getElementById('urlOpen');
const titleEl = document.getElementById('titleInput');
const urlEl   = document.getElementById('urlInput');
const textEl  = document.getElementById('textInput');

// Pre-fill current tab
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  titleEl.value = tab.title || '';
  urlEl.value   = tab.url   || '';
});

// Open URL in new tab
urlOpen.addEventListener('click', () => {
  const url = urlEl.value.trim();
  if (url) chrome.tabs.create({ url });
});

// Save
saveBtn.addEventListener('click', () => {
  if (saveBtn.classList.contains('saved')) return;

  const title = titleEl.value.trim();
  const url   = urlEl.value.trim();
  const text  = textEl.value.trim();

  if (!title && !url && !text) { titleEl.focus(); return; }

  const clip = {
    id:    Date.now().toString(),
    url:   url || '',
    title: title || url || 'Untitled',
    text,
    note:  '',
    ts:    Date.now(),
  };

  chrome.storage.local.get({ clips: [] }, ({ clips }) => {
    chrome.storage.local.set({ clips: [clip, ...clips].slice(0, 500) });
  });

  saveBtn.textContent = 'Saved ✓';
  saveBtn.classList.add('saved');

  setTimeout(() => {
    saveBtn.textContent = 'Save Clip';
    saveBtn.classList.remove('saved');
    textEl.value = '';
    textEl.focus();
  }, 1400);
});

// Dashboard
dashBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});
