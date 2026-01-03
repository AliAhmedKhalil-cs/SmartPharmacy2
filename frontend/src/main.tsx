import './index.css'  // ✅ التأكد من استدعاء ملف التصميم الجديد
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // ✅ الآن هذا صحيح لأننا غيرنا اسم الملف لـ App.tsx

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)