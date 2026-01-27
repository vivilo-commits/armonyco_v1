import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/frontend/styles/index.css';

// Initialize i18n
import '@/backend/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/backend/i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// Global error handler for chunk loading failures (deployment cache issues)
window.addEventListener('error', (e) => {
  // Check for the specific Vite/Rollup chunk load error
  const isChunkError = /Loading chunk \d+ failed|Failed to fetch dynamically imported module/.test(e.message);

  if (isChunkError) {
    console.warn('[System] Chunk load error detected, reloading...', e.message);

    // Prevent infinite reload loops by checking a timestamp
    const lastReload = sessionStorage.getItem('chunk_reload');
    const now = Date.now();

    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem('chunk_reload', now.toString());
      window.location.reload();
    }
  }
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);
