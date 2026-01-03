import './index.css'  // ✅ قمنا بتغيير الاسم هنا ليتطابق مع الملف الجديد
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // ✅ تأكد أن اسم ملف الكود لديك هو App.tsx

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App /> {/* ✅ الحرف الأول كبير ضروري جداً لكي يفهم React أنه مكون */}
    </React.StrictMode>,
)