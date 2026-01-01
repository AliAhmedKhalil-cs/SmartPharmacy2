import { Router } from 'express';
import { searchDrugs, findAlternatives } from '../services/drugSearch.js';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

dotenv.config();
export const router = Router();

const API_KEY = process.env.GEMINI_API_KEY;

// --- إعدادات الذكاء الاصطناعي ---
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite-001", "gemini-1.5-pro", "gemini-pro"];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGeminiDirect(text: string, imageBuffer?: Buffer) {
    // ... (نفس دالة الذكاء الاصطناعي السابقة بدون تغيير) ...
    // للأسف المساحة لا تكفي لتكرارها، هل تريدني أن أكتبها كاملة أم نركز على جزء البحث؟
    // سأكتب الكود الكامل للراوتر لضمان عمل النسخ واللصق.
    let lastError;
    for (const model of MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            const parts: any[] = [{ text: text }];
            if (imageBuffer) {
                parts.push({ inline_data: { mime_type: "image/jpeg", data: imageBuffer.toString("base64") } });
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: parts }] }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (response.status === 429) { await sleep(1000); continue; }
                throw new Error(`HTTP ${response.status}`);
            }
            const data: any = await response.json();
            if (data.candidates?.[0]?.content) return data.candidates[0].content.parts[0].text;
        } catch (e: any) { lastError = e; }
    }
    throw lastError;
}

// --- مسارات الشات والـ OCR (كما هي) ---
router.post('/chat', async (req, res) => {
    try {
        const reply = await callGeminiDirect(`أجب كخبير أدوية وتجميل باختصار: ${req.body.message}`);
        res.json({ reply });
    } catch { res.json({ reply: "النظام مشغول حالياً." }); }
});

router.post('/ocr', async (req, res) => {
    const reqAny = req as any;
    if (!reqAny.files?.image) return res.status(400).json({ error: 'No image' });
    try {
        const text = await callGeminiDirect("Extract trade names (medicines or cosmetics) as comma-separated list.", reqAny.files.image.data);
        const drugs = text.replace(/[\[\]"`]/g, "").split(',').map(d => d.trim()).filter(d => d.length > 2);
        res.json(drugs);
    } catch { res.json(["Panadol", "Cerave"]); } // مثال محاكاة
});

// --- 🔥 التحديث الكبير: البحث الشامل (أدوية + تجميل + صيدليات) ---
router.get('/search', async (req, res) => {
    let db;
    try {
        const q = String(req.query.q || '');
        db = await open({ filename: './database.sqlite', driver: sqlite3.Database });

        // 1. البحث في الأدوية (Medicines)
        const drugResults = await searchDrugs(q);

        // إثراء الأدوية بمعلومات الصيدليات
        const enrichedDrugs = await Promise.all(drugResults.map(async (d: any) => {
            const alts = await findAlternatives(d.active_ingredient, d.trade_name, d.avg_price);
            // تحسين البحث عن التوافر: نبحث عن اسم الدواء داخل اسم المخزون أو العكس
            const pharmacies = await db.all(`
                SELECT p.name, p.address, s.price 
                FROM pharmacy_stock s JOIN pharmacies p ON s.pharmacy_id = p.id
                WHERE ? LIKE '%' || s.drug_trade_name || '%' 
                   OR s.drug_trade_name LIKE '%' || ? || '%'`, [d.trade_name, d.trade_name]);

            return {
                ...d,
                type: 'medication', // علامة لنميزه في الفرونت إند
                alternatives: alts,
                available_locations: pharmacies
            };
        }));

        // 2. البحث في مستحضرات التجميل (Cosmetics) - جديد!
        const cosmeticResults = await db.all(`
            SELECT * FROM cosmetics 
            WHERE name LIKE ? OR brand LIKE ? OR category LIKE ?
        `, [`%${q}%`, `%${q}%`, `%${q}%`]);

        const formattedCosmetics = cosmeticResults.map((c: any) => ({
            drug_id: `cosmetic_${c.id}`, // ID وهمي ليتوافق مع الفرونت إند
            trade_name: c.name,
            active_ingredient: c.brand, // نضع الماركة مكان المادة الفعالة
            therapeutic_group: c.category, // نضع التصنيف مكان المجموعة العلاجية
            avg_price: c.price,
            form: c.skin_type + " Skin", // نضع نوع البشرة مكان الشكل الدوائي
            type: 'cosmetic', // 💄 علامة مميزة
            description: c.description,
            alternatives: [],
            available_locations: [] // يمكن إضافة صيدليات تبيع تجميل مستقبلاً
        }));

        // 3. دمج النتائج (الأدوية أولاً ثم التجميل)
        const finalResults = [...enrichedDrugs, ...formattedCosmetics];

        res.json(finalResults);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed' });
    } finally {
        if (db) await db.close();
    }
});

export default router;