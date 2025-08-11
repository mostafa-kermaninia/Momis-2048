// frontend/src/App.js (نسخه موقت برای تست)

import React from 'react';

function App() {
  // یک پیام ساده برای اطمینان از اینکه React کار می‌کند
  const [message, setMessage] = React.useState("React App is running...");

  // یک هوک ساده برای تست تعامل با آبجکت تلگرام
  React.useEffect(() => {
    try {
      // ما فقط چک می‌کنیم آبجکت تلگرام وجود دارد یا نه
      if (window.Telegram && window.Telegram.WebApp) {
        setMessage("Telegram WebApp object found! App should load.");
        // به تلگرام اطلاع می‌دهیم که آماده‌ایم
        window.Telegram.WebApp.ready();
      } else {
        setMessage("Running outside of Telegram. This is normal for a browser.");
      }
    } catch (error) {
      // اگر خطایی در دسترسی به آبجکت تلگرام رخ دهد، آن را نمایش می‌دهیم
      setMessage(`Error accessing Telegram object: ${error.message}`);
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0d1f3a',
      color: 'white',
      fontSize: '24px',
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <h1>{message}</h1>
    </div>
  );
}

export default App;