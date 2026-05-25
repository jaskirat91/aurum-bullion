import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ConfirmationProvider } from './context/ConfirmationContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfirmationProvider>
      <App />
    </ConfirmationProvider>
  </React.StrictMode>
);
