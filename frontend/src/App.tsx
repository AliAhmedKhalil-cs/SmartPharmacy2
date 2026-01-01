import { useState, useRef } from 'react';
import './App.css';

const API_BASE_URL = "http://localhost:3000/api";

function App() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [userAllergy, setUserAllergy] = useState<string>('');

    // الشات بوت
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{sender: 'user'|'bot', text: string}[]>([]);
    const [currentMsg, setCurrentMsg] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // دالة البحث
    const handleSearch = async (val = query) => {
        if (!val) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(val)}`);
            const data = await res.json();
            setResults(data);
        } catch { alert('تأكد من تشغيل السيرفر!'); }
        finally { setLoading(false); }
    };

    // دالة الكاميرا
    const handleFileUpload = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        setAnalyzing(true);
        const fd = new FormData();
        fd.append('image', file);

        try {
            const res = await fetch(`${API_BASE_URL}/ocr`, { method: 'POST', body: fd });
            const drugNames = await res.json();

            if (Array.isArray(drugNames) && drugNames.length > 0) {
                const detectedDrug = drugNames[0];
                setQuery(detectedDrug);
                await handleSearch(detectedDrug);
            } else { alert("الصورة غير واضحة. حاول مرة أخرى."); }
        } catch { alert('فشل الاتصال بخدمة تحليل الصور'); }
        finally {
            setAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // دالة الشات
    const sendChat = async () => {
        if (!currentMsg) return;
        const msg = currentMsg;
        setChatMessages(p => [...p, { sender: 'user', text: msg }]);
        setCurrentMsg('');
        setChatLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            const data = await res.json();
            setChatMessages(p => [...p, { sender: 'bot', text: data.reply }]);
        } finally { setChatLoading(false); }
    };

    return (
        <div className="app-wrapper" dir="rtl" style={{fontFamily: 'Segoe UI, sans-serif', background: '#f0f9ff', minHeight: '100vh'}}>
            {/* 🔵 الهيدر الأزرق الأصلي */}
            <header className="header" style={{
                textAlign: 'center',
                padding: '30px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', // الأزرق الملكي
                color: 'white',
                borderRadius: '0 0 30px 30px',
                marginBottom: '30px',
                boxShadow: '0 4px 20px rgba(30, 64, 175, 0.2)'
            }}>
                <h1 style={{fontSize: '2.8rem', margin: 0}}>💎 SmartPharmacy</h1>
                <p style={{opacity: 0.9, fontSize: '1.1rem'}}>منصتك الذكية للرعاية الصحية والتجميل</p>
            </header>

            <div className="container" style={{maxWidth: '900px', margin: '0 auto', padding: '0 20px'}}>

                <div className="control-panel" style={{background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}}>

                    {/* زر الحساسية */}
                    <div style={{marginBottom: '15px'}}>
                        <button
                            onClick={() => setUserAllergy(prompt("ما هي المادة التي تسبب لك حساسية؟") || "")}
                            style={{
                                background: userAllergy ? '#fee2e2' : '#eff6ff',
                                color: userAllergy ? '#991b1b' : '#1e40af',
                                border: '1px solid #dbeafe',
                                padding: '8px 15px',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {userAllergy ? `⚠️ تحذير نشط: ${userAllergy}` : "🛡️ تفعيل تنبيه الحساسية"}
                        </button>
                    </div>

                    {/* البحث والكاميرا */}
                    <div style={{display: 'flex', gap: '10px'}}>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={analyzing || loading}
                            style={{
                                background: analyzing ? '#9ca3af' : '#10b981', // أخضر للكاميرا
                                color: 'white', border: 'none', borderRadius: '15px', width: '60px',
                                cursor: 'pointer', fontSize: '1.6rem', transition: 'transform 0.2s'
                            }}
                        >
                            {analyzing ? '⏳' : '📷'}
                        </button>

                        <input
                            placeholder={analyzing ? "جاري القراءة..." : "ابحث عن دواء أو مستحضر تجميل..."}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                                flex: 1, padding: '15px', borderRadius: '15px',
                                border: '2px solid #bfdbfe', fontSize: '1.1rem', outline: 'none'
                            }}
                        />

                        <button
                            onClick={() => handleSearch()}
                            style={{
                                background: '#2563eb', // أزرق للبحث
                                color: 'white', border: 'none', padding: '0 30px',
                                borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem'
                            }}
                        >
                            بحث
                        </button>
                    </div>
                </div>

                {loading && <div style={{textAlign:'center', marginTop:'30px', color: '#2563eb', fontWeight: 'bold'}}>🔄 جاري البحث...</div>}

                {/* النتائج */}
                <div className="results-grid" style={{marginTop: '30px', display: 'grid', gap: '20px'}}>
                    {results.map((item: any, i) => {
                        const allergic = userAllergy && item.active_ingredient?.toLowerCase().includes(userAllergy.toLowerCase());
                        const isCosmetic = item.type === 'cosmetic';

                        return (
                            <div key={i} className="drug-card" style={{
                                background: 'white', padding: '0', borderRadius: '20px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden',
                                borderLeft: isCosmetic ? '6px solid #ec4899' : '6px solid #2563eb', // 🌸 وردي للتجميل، 🔵 أزرق للدواء
                                border: allergic ? '2px solid red' : 'none'
                            }}>
                                <div style={{padding: '25px', borderBottom: '1px solid #f0f9ff'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                                        <span style={{
                                            background: isCosmetic ? '#fce7f3' : '#eff6ff',
                                            color: isCosmetic ? '#be185d' : '#1e40af',
                                            padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold'
                                        }}>
                                            {isCosmetic ? `✨ ${item.therapeutic_group}` : `💊 ${item.therapeutic_group}`}
                                        </span>
                                        <span style={{color: '#64748b'}}>🏷️ {item.form}</span>
                                    </div>

                                    <h3 style={{fontSize: '1.5rem', margin: '5px 0', color: '#1e293b'}}>{item.trade_name}</h3>

                                    {isCosmetic ? (
                                        <p style={{color: '#db2777', margin: '5px 0'}}>Brand: {item.active_ingredient}</p>
                                    ) : (
                                        <p style={{color: '#475569', margin: '5px 0'}}>🧪 المادة الفعالة: {item.active_ingredient}</p>
                                    )}

                                    {allergic && !isCosmetic && <div style={{background: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '10px', marginTop: '10px'}}>⛔ تحذير حساسية!</div>}
                                </div>

                                {/* توافر المنتج */}
                                {item.available_locations?.length > 0 ? (
                                    <div style={{background: isCosmetic ? '#fff1f2' : '#f0fdfa', padding: '20px'}}>
                                        <h4 style={{margin: '0 0 10px 0', color: isCosmetic ? '#be185d' : '#0f766e', fontSize: '1rem'}}>🏪 متوفر في:</h4>
                                        <div style={{display: 'grid', gap: '10px'}}>
                                            {item.available_locations.map((loc: any, idx: number) => (
                                                <div key={idx} style={{background: 'white', padding: '10px 15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                    <div>
                                                        <div style={{fontWeight: 'bold', color: '#334155'}}>{loc.name}</div>
                                                        <div style={{fontSize: '0.8rem', color: '#64748b'}}>📍 {loc.address}</div>
                                                    </div>
                                                    <div style={{textAlign: 'center'}}>
                                                        <div style={{fontWeight: 'bold', color: '#059669'}}>{loc.price} ج.م</div>
                                                        <button style={{background: isCosmetic ? '#be185d' : '#2563eb', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', fontSize: '0.8rem', marginTop: '5px', cursor: 'pointer'}}>حجز</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{padding: '15px', background: '#fff7ed', color: '#c2410c', textAlign: 'center', fontSize: '0.9rem', borderTop: '1px solid #ffedd5'}}>
                                        ⚠️ هذا الدواء غير متوفر في الصيدليات المتعاقدة حالياً، يمكنك طلب توفيره أو البحث عن البدائل أدناه.
                                    </div>
                                )}

                                {/* البدائل */}
                                {!isCosmetic && item.alternatives?.length > 0 && (
                                    <div style={{padding: '20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0'}}>
                                        <div style={{fontSize: '0.9rem', color:'#475569', marginBottom: '10px'}}>✨ بدائل:</div>
                                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                                            {item.alternatives.map((a:any, j:number) => (
                                                <div key={j} style={{background:'white', color:'#059669', padding:'5px 10px', borderRadius:'15px', fontSize:'0.85rem', border: '1px solid #cbd5e1'}}>
                                                    {a.trade_name} <b>({a.avg_price} ج.م)</b>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* الشات */}
            <div className="chat-widget" style={{position: 'fixed', bottom: '20px', left: '20px'}}>
                {!isChatOpen ? (
                    <button onClick={() => setIsChatOpen(true)} style={{width: '60px', height: '60px', borderRadius: '50%', background: '#2563eb', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'}}>💬</button>
                ) : (
                    <div className="chat-box" style={{width: '320px', height: '450px', background: 'white', borderRadius: '15px', boxShadow: '0 5px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
                        <div style={{background: '#2563eb', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between'}}>
                            <strong>المساعد الذكي</strong>
                            <button onClick={() => setIsChatOpen(false)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>✖</button>
                        </div>
                        <div style={{flex:1, padding:'15px', overflowY:'auto', background:'#f8fafc'}}>
                            {chatMessages.map((m, i) => (
                                <div key={i} style={{textAlign: m.sender==='user'?'left':'right', margin:'8px 0'}}>
                                    <span style={{background: m.sender==='user'?'#2563eb':'#e2e8f0', color: m.sender==='user'?'white':'black', padding:'8px 12px', borderRadius:'12px', display:'inline-block'}}>{m.text}</span>
                                </div>
                            ))}
                            {chatLoading && <div>...</div>}
                        </div>
                        <div style={{padding:'10px', display:'flex'}}>
                            <input style={{flex:1, padding:'8px', border:'1px solid #ccc', borderRadius:'20px'}} value={currentMsg} onChange={e=>setCurrentMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} />
                            <button onClick={sendChat} style={{background:'none', border:'none'}}>➤</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;