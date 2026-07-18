chrome.storage.local.get({ clips: [] }, ({ clips }) => {
  updateBadge(clips.length);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.clips) {
    updateBadge(changes.clips.newValue?.length ?? 0);
  }
});

function updateBadge(count) {
  const text = count > 0 ? (count > 99 ? '99+' : String(count)) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#1a1a1a' });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-page') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) return;
      const clip = {
        id: Date.now().toString(),
        url: tab.url || '',
        title: tab.title || tab.url || 'Untitled',
        text: '',
        note: 'Saved via keyboard shortcut',
        ts: Date.now(),
      };
      chrome.storage.local.get({ clips: [] }, ({ clips }) => {
        chrome.storage.local.set({ clips: [clip, ...clips].slice(0, 500) });
      });
    });
  }
});
