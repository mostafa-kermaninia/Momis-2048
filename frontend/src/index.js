import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // ما استایل‌های اصلی را اینجا وارد می‌کنیم
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);