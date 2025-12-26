import React from 'react';
import { createRoot } from 'react-dom/client';
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
    container.innerHTML = `
      <div style="background: #1e293b; color: #f87171; padding: 2rem; font-family: monospace; border: 2px solid #ef4444; margin: 2rem;">
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">[SYSTEM_FATAL_ERROR]</h1>
        <p>初始化失敗：${err instanceof Error ? err.message : '未知錯誤'}</p>
        <p style="margin-top: 1rem; color: #94a3b8; font-size: 0.875rem;">請確認 API Key 是否已正確配置於環境變數中。</p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; background: #c2410c; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer;">RETRY_BOOT</button>
      </div>
    `;
  }
}
