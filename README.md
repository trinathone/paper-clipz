# Paper Clipz

Save text from any webpage. Find it later. That's it.

![demo](demo.gif)

---

## Why I built this

I kept losing things I read online. Copy-pasting into Notes is annoying. Bookmarks don't save the actual text. I wanted something that just works — highlight, click, done. No account, no sync, no cloud. Just my stuff on my machine.

---

## How to install locally

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions`
3. Turn on **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `paper-clipz` folder
6. Done. The 📎 icon shows up in your toolbar

---

## How to use

**Saving from a page:**
Highlight any text → click the 📎 button that floats on the page → add an optional note → hit Save

**Saving manually:**
Click the extension icon → fill in title, URL, and text → Save Clip

**Finding stuff:**
Click the extension icon → Dashboard → search anything. Filters by domain too.

**Deleting:**
Hit × on any card. Gone.

---

## Tech stack

- Vanilla JS — no framework, no build step
- Chrome Extension Manifest V3
- `chrome.storage.local` for persistence
- Shadow DOM for the floating button (so it doesn't break on sites with strict CSS)
- `adoptedStyleSheets` instead of inline `<style>` tags so it works on sites with strict CSPs (Perplexity, Google, etc.)
- Plain HTML/CSS for the dashboard

Everything runs in the browser. No backend. No external requests. No telemetry.

---

## License

MIT
