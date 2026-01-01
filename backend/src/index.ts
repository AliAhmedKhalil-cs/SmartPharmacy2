import express, { Request, Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

// تحميل متغيرات البيئة من ملف .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. الإعدادات الوسيطة (Middlewares) ---

// تفعيل CORS للسماح للفرونت اند بالاتصال بالسيرفر
app.use(cors());

// هام جداً: تفعيل قراءة JSON لكي يعمل الشات بوت ويستقبل الرسائل
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// إعدادات رفع الملفات (لضمان استقبال صور الروشتات بوضوح)
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // حد أقصى 10 ميجا للصورة
    abortOnLimit: true,
    createParentPath: true
}));

// --- 2. المسارات (Routes) ---

// صفحة ترحيبية عند فتح http://localhost:3000 لمنع خطأ "Cannot GET /"
app.get('/', (req: Request, res: Response) => {
    res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #1e3c72;">🚀 SmartPharmacy API is Running</h1>
            <p style="color: #666;">السيرفر يعمل الآن وجاهز لاستقبال الطلبات.</p>
            <div style="background: #f4f7f6; padding: 20px; border-radius: 10px; display: inline-block;">
                <code>Endpoint: http://localhost:${PORT}/api</code>
            </div>
        </div>
    `);
});

// ربط مسارات الـ API (البحث، الشات، والروشتة)
app.use('/api', apiRoutes);

// --- 3. تشغيل السيرفر ---

app.listen(PORT, () => {
    console.log(`
    =================================================
    ✅ SmartPharmacy Backend is live!
    🌍 URL: http://localhost:${PORT}
    🤖 AI Features (Chat & OCR) are active
    =================================================
    `);
});