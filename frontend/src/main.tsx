import './styles.css'  // ✅ استدعاء الملف بالاسم الجديد
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // ✅ تعديل الحرف ليكون كبيراً ليطابق اسم الملف App.tsx

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)