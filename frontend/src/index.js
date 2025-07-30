import React from 'react';
import ReactDOM from 'react-dom/client';
import './main.css'; // این خط صحیح است
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);