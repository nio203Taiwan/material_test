import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err: any) {
    console.error("Critical Boot Failure:", err);
    container.innerHTML = `
      <div style="background:#1a1d21; color:#f87171; padding:40px; font-family:monospace; border:2px solid #c2410c; margin:20px;">
        <h2 style="color:#c2410c">[系統初始化錯誤]</h2>
        <p>原因：${err?.message || '模組解析衝突'}</p>
        <hr style="border-color:#334155; margin:20px 0;">
        <p style="font-size:12px; color:#64748b;">請檢查是否受到瀏覽器擴充功能干擾，或嘗試清除快取後重新載入。</p>
      </div>
    `;
  }
}