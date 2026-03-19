import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { configureLlm } from '@startup-meeting/composer';
import App from './App';
import './index.css';

// Load saved settings
const savedSettings = localStorage.getItem('startup-meeting-settings');
if (savedSettings) {
  try {
    const { apiKey, serverUrl } = JSON.parse(savedSettings) as { apiKey?: string; serverUrl?: string };
    configureLlm({
      mode: apiKey ? 'api' : 'cli',
      apiKey: apiKey || undefined,
      serverUrl: serverUrl || 'http://localhost:3001',
    });
  } catch {
    // ignore malformed saved settings
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
