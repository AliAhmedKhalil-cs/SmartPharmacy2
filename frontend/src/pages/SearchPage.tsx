import React, { useState, useRef } from 'react';

// تعريف نوع البيانات
type Product = {
    drug_id: string;
    trade_name: string;
    active_ingredient: string;
    avg_price: number;
    alternatives: Array<{ trade_name: string; avg_price: number }>;
};

export default function SearchPage() {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false); // حالة تحميل الكاميرا

    // مرجع لزر رفع الملفات المخفي
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- دالة البحث النصي ---
    async function performSearch(query: string) {
        if (!query) return;
        setLoading(true);
        try {
            // استخدام رابط كامل لتفادي مشاكل الشبكة
            const r = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
            const data = await r.json();
            setResults(data);
        } catch (err) {
            console.error("Search Error:", err);
            alert("تأكد من تشغيل سيرفر الباك اند!");
        } finally {
            setLoading(false);
        }
    }

    // --- عند الضغط على زر بحث ---
    function onSearchClick() {
        performSearch(q);
    }

    // --- عند اختيار صورة من الكاميرا/الاستوديو ---
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setAnalyzing(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            // إرسال الصورة للسيرفر
            const res = await fetch('http://localhost:3000/api/ocr', {
                method: 'POST',
                body: formData,
            });

            const drugNames = await res.json();

            if (Array.isArray(drugNames) && drugNames.length > 0) {
                const detectedDrug = drugNames[0]; // أخذ أول دواء
                setQ(detectedDrug); // وضعه في مربع البحث
                performSearch(detectedDrug); // تشغيل البحث فوراً
            } else {
                alert("لم يتم التعرف على اسم دواء واضح. حاول التقاط صورة أوضح.");
            }
        } catch (err) {
            alert("فشل الاتصال بخدمة تحليل الصور");
        } finally {
            setAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // تصفير الملف
        }
    }

    return (
        <div className="p-4 max-w-3xl mx-auto font-sans text-right" dir="rtl">

            {/* العنوان للتأكد من التحديث */}
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">
                🩺 الصيدلية الذكية (نسخة AI)
            </h1>

            <div className="flex gap-3 items-center bg-gray-50 p-4 rounded-xl shadow-lg border border-gray-200">

                {/* زر الكاميرا الأخضر */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <button
                    className={`p-4 rounded-full text-white shadow-md transition-all transform hover:scale-110 ${analyzing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing || loading}
                    title="صور الروشتة"
                >
                    {analyzing ? (
                        <span className="animate-spin block text-xl">⏳</span>
                    ) : (
                        <span className="text-xl">📷</span>
                    )}
                </button>

                {/* حقل الإدخال */}
                <input
                    className="border-2 border-gray-300 p-3 flex-1 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
                    placeholder={analyzing ? "جاري قراءة الروشتة..." : "ابحث عن دواء (أو صور الروشتة)..."}
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    disabled={analyzing}
                />

                {/* زر البحث الأزرق */}
                <button
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-bold text-lg shadow-md"
                    onClick={onSearchClick}
                    disabled={loading || analyzing}
                >
                    {loading ? '...' : 'بحث'}
                </button>
            </div>

            {/* منطقة النتائج */}
            <div className="mt-8">
                {results.map(p => (
                    <div key={p.drug_id} className="bg-white border border-gray-200 p-5 mb-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{p.trade_name}</h2>
                                <p className="text-gray-600 mt-1">المادة الفعالة: {p.active_ingredient}</p>
                                <div className="mt-2 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                    السعر: {p.avg_price} ج.م
                                </div>
                            </div>
                            <a
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm shadow-sm"
                                href={`/pharmacies?drug_id=${p.drug_id}`}
                            >
                                📍 أقرب صيدلية
                            </a>
                        </div>

                        {/* البدائل */}
                        {p.alternatives.length > 0 && (
                            <div className="mt-5 bg-green-50 p-4 rounded-lg border border-green-100">
                                <h3 className="font-bold text-green-800 mb-3 flex items-center">
                                    ✨ بدائل اقتصادية متوفرة:
                                </h3>
                                <ul className="space-y-2">
                                    {p.alternatives.map((a, i) => (
                                        <li key={i} className="flex justify-between items-center bg-white p-2 rounded border border-green-100">
                                            <span className="font-medium text-gray-700">{a.trade_name}</span>
                                            <span className="font-bold text-green-600">{a.avg_price} ج.م</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}