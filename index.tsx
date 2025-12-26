import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Mounting error:", error);
  rootElement.innerHTML = `<div style="padding: 20px; color: #f87171; font-family: monospace;">
    <h2>System Boot Error</h2>
    <p>${error instanceof Error ? error.message : 'Unknown fatal error during mount'}</p>
    <button onclick="window.location.reload()" style="background: #334155; color: white; padding: 8px 16px; border: none; cursor: pointer;">Retry Boot</button>
  </div>`;
}