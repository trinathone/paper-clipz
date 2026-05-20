(function () {
  function inject() {
    if (document.getElementById('pcz-root')) return;

    const target = document.body || document.documentElement;
    if (!target) { setTimeout(inject, 200); return; }

    const root = document.createElement('div');
    root.id = 'pcz-root';
    Object.assign(root.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '2147483647',
    });

    try {
      target.appendChild(root);
    } catch (e) {
      return;
    }

    const shadow = root.attachShadow({ mode: 'open' });

    // adoptedStyleSheets bypasses page CSP — works on Perplexity, Google, etc.
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        #btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(145deg, #1c1c1f, #2e2e35);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 18px rgba(0,0,0,0.32), 0 1px 4px rgba(0,0,0,0.18);
          transition: transform 0.15s, box-shadow 0.15s;
          user-select: none;
        }
        #btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.22);
        }
        #btn:active { transform: scale(0.95); }

        #panel {
          position: absolute;
          bottom: 48px;
          right: 0;
          width: 290px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 6px 28px rgba(0,0,0,0.16);
          overflow: hidden;
          display: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 13px;
          color: #1a1a1a;
        }
        #panel.open { display: block; }

        .ph {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #fafafa;
          border-bottom: 1px solid #efefef;
          font-weight: 600;
          font-size: 12px;
        }

        .xbtn {
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          font-size: 17px;
          line-height: 1;
          padding: 0;
        }
        .xbtn:hover { color: #1a1a1a; }

        .sel-preview {
          margin: 10px 12px 0;
          padding: 8px 10px;
          background: #f5f5f5;
          border-left: 3px solid #1a1a1a;
          border-radius: 0 6px 6px 0;
          font-size: 11px;
          color: #444;
          max-height: 80px;
          overflow-y: auto;
          line-height: 1.5;
          display: none;
        }
        .sel-preview.show { display: block; }

        .hint {
          margin: 10px 12px 0;
          font-size: 11px;
          color: #bbb;
          display: none;
        }
        .hint.show { display: block; }

        textarea {
          display: block;
          width: calc(100% - 24px);
          margin: 8px 12px;
          padding: 8px 10px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 12px;
          font-family: inherit;
          resize: none;
          height: 62px;
          outline: none;
          color: #1a1a1a;
          background: #fff;
          line-height: 1.5;
        }
        textarea:focus { border-color: #1a1a1a; }
        textarea::placeholder { color: #bbb; }

        .actions { padding: 0 12px 12px; }

        .sbtn {
          width: 100%;
          padding: 7px;
          background: #1a1a1a;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .sbtn:hover { background: #333; }
        .sbtn.done { background: #16a34a; cursor: default; }
      `);
      shadow.adoptedStyleSheets = [sheet];
    } catch (e) {
      // Fallback: inject a <style> element (older browsers)
      const style = document.createElement('style');
      style.textContent = '* { box-sizing: border-box; margin: 0; padding: 0; }';
      shadow.appendChild(style);
    }

    // Build DOM without any <style> tags
    const panel = document.createElement('div');
    panel.id = 'panel';
    panel.innerHTML = `
      <div class="ph">
        <span>Paper Clipz</span>
        <button class="xbtn" id="closeBtn">×</button>
      </div>
      <div class="sel-preview" id="selPreview"></div>
      <div class="hint" id="hint">No text selected — add a note below</div>
      <textarea id="noteInput" placeholder="Quick note..."></textarea>
      <div class="actions">
        <button class="sbtn" id="saveBtn">Save</button>
      </div>
    `;

    const btn = document.createElement('button');
    btn.id = 'btn';
    btn.title = 'Paper Clipz';
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
           stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
      </svg>
    `;

    shadow.appendChild(panel);
    shadow.appendChild(btn);

    const closeBtn = shadow.getElementById('closeBtn');
    const selPre   = shadow.getElementById('selPreview');
    const hint     = shadow.getElementById('hint');
    const noteEl   = shadow.getElementById('noteInput');
    const saveBtn  = shadow.getElementById('saveBtn');

    let captured = '';

    function openPanel() {
      captured = window.getSelection().toString().trim();
      if (captured) {
        selPre.textContent = captured;
        selPre.classList.add('show');
        hint.classList.remove('show');
      } else {
        selPre.classList.remove('show');
        hint.classList.add('show');
      }
      noteEl.value = '';
      saveBtn.textContent = 'Save';
      saveBtn.classList.remove('done');
      panel.classList.add('open');
      noteEl.focus();
    }

    function closePanel() { panel.classList.remove('open'); }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.contains('open') ? closePanel() : openPanel();
    });
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closePanel();
    });

    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (saveBtn.classList.contains('done')) return;
      const noteVal = noteEl.value.trim();
      if (!captured && !noteVal) { noteEl.focus(); return; }

      const clip = {
        id: Date.now().toString(),
        url: location.href,
        title: document.title || location.hostname,
        text: captured,
        note: noteVal,
        ts: Date.now(),
      };

      chrome.storage.local.get({ clips: [] }, ({ clips }) => {
        chrome.storage.local.set({ clips: [clip, ...clips].slice(0, 500) });
      });

      saveBtn.textContent = 'Saved ✓';
      saveBtn.classList.add('done');
      setTimeout(closePanel, 900);
    });

    // Stop keyboard events (space, backspace, arrows) from reaching the page.
    // Sites like YouTube and Perplexity intercept these and prevent textarea input.
    for (const ev of ['keydown', 'keyup', 'keypress']) {
      noteEl.addEventListener(ev, e => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
    }

    // Capture-phase: when panel is open, consume ALL outside clicks so the page
    // never receives them. composedPath() is required for shadow DOM hit-testing.
    document.addEventListener('mousedown', e => {
      if (!panel.classList.contains('open')) return;
      if (!e.composedPath().includes(root)) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closePanel();
      }
    }, true);

    document.addEventListener('click', e => {
      if (!panel.classList.contains('open')) return;
      if (!e.composedPath().includes(root)) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }, true);

    // Re-inject if something removes the root (aggressive SPAs)
    const observer = new MutationObserver(() => {
      if (!document.getElementById('pcz-root')) {
        observer.disconnect();
        setTimeout(inject, 300);
      }
    });
    observer.observe(document.documentElement, { childList: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
