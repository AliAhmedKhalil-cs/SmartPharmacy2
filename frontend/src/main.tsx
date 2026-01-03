import './app.css' // ✅ حرف صغير (لحل مشكلة Vercel)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app' // ✅ استدعاء الملف (تأكد أن اسم الملف عندك app.tsx أو App.tsx)

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App /> {/* ✅ يجب أن يكون الحرف الأول كبيراً هنا لكي يعمل React */}
    </React.StrictMode>,
)