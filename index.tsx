import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  console.error("Fatal: Root container not found.");
} else {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Mounting error:", err);
    if (container) {
        container.innerHTML = `
          <div style="background: #0d0f11; color: #f87171; padding: 2rem; font-family: 'Fira Code', monospace; border: 2px solid #c2410c; margin: 2rem; line-height: 1.6;">
            <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #c2410c;">[SYSTEM_BOOT_FAILURE]</h1>
            <p><strong>原因：</strong> ${err instanceof Error ? err.message : '核心衝突'}</p>
            <p style="margin-top: 1rem; color: #64748b; font-size: 0.875rem;">系統嘗試繞過版本衝突，但環境強制限制了模組載入。</p>
            <button onclick="window.location.reload()" style="margin-top: 1.5rem; background: #c2410c; color: white; padding: 0.75rem 1.5rem; border: none; cursor: pointer; font-weight: bold;">RE-INITIALIZE</button>
          </div>
        `;
    }
  }
}