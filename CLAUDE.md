# Paper Clipz — Dev Sprint

## What needs to be done

Paper Clipz is a Chrome extension that saves text clips. Core functionality is complete. Today add three improvements:

---

## TASK 1: Clip count badge on extension icon

### File: `background.js` (NEW FILE — create this)

Create a service worker that keeps the extension icon badge updated with the total clip count.

```javascript
// background.js
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
```

### File: `manifest.json`

Add to manifest:
1. Add `"background": { "service_worker": "background.js" }` 
2. Add `"action.default_badge_text": ""` — not needed, just register the service worker

Updated manifest.json should look like:
```json
{
  "manifest_version": 3,
  "name": "Paper Clipz",
  "version": "1.1",
  "description": "Save selected text and notes from any page",
  "permissions": ["storage", "tabs", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Paper Clipz"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ]
}
```

---

## TASK 2: Export clips to JSON

### File: `dashboard.js`

Add an export function. When user clicks "Export", download all clips as a JSON file.

1. Add export button to `dashboard.html` in the topbar-right section:
   ```html
   <button class="theme-btn" id="exportBtn" title="Export clips as JSON">↓ Export</button>
   ```

2. In `dashboard.js`, add the handler after the existing theme toggle:
   ```javascript
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
   ```

---

## TASK 3: Keyboard shortcut — Cmd+Shift+S to save current page

### File: `manifest.json`

Add commands section:
```json
"commands": {
  "save-page": {
    "suggested_key": {
      "mac": "Command+Shift+S",
      "default": "Ctrl+Shift+S"
    },
    "description": "Save current page to Paper Clipz"
  }
}
```

### File: `background.js`

Add command listener to the existing background.js:
```javascript
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
```

---

## TASK 4: Clip count in popup

### File: `popup.html`

Show total clip count in the header. Add a small count badge next to the logo:

```html
<div class="header">
  <span class="logo">📎 Paper Clipz <span id="clipCount" style="font-size:10px;opacity:0.5;font-weight:400;"></span></span>
  <button class="dash-btn" id="dashBtn">Dashboard →</button>
</div>
```

### File: `popup.js`

Add at the top after the existing variable declarations:

```javascript
chrome.storage.local.get({ clips: [] }, ({ clips }) => {
  const el = document.getElementById('clipCount');
  if (el) el.textContent = clips.length ? `(${clips.length})` : '';
});
```

---

## TASK 5: Version bump and README update

Bump manifest.json version to `"1.1"` (if not already done in Task 1).

Update `README.md` to add a section for the new features:
- Badge: "The extension icon now shows how many clips you have saved."
- Export: "Click ↓ Export on the dashboard to download all your clips as a JSON file."
- Keyboard shortcut: "Cmd+Shift+S (Mac) / Ctrl+Shift+S (Windows) instantly saves the current page."

Add this after the existing "How to use" section.

---

## RULES

- No backend, no server, no API calls
- All changes are to static JS/HTML files only
- After all edits, verify the files are syntactically correct JavaScript (look for obvious errors)
- The extension must remain loadable as an unpacked extension (manifest v3 valid)
