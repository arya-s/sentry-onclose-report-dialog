import App from './App.tsx';
import './App.css';
import { init } from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

init({
  dsn: 'http://be6167975a3d120e0a783ed697576bf0@127.0.0.1:8000/3',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
