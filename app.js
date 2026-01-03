const qEl = document.getElementById("q");
const allergenEl = document.getElementById("allergen");
const exactEl = document.getElementById("exact");
const fuzzyEl = document.getElementById("fuzzy");
const statusEl = document.getElementById("status");
const perPageEl = document.getElementById("per_page");
const portIndicator = document.getElementById("port-indicator");

let pageExact = 1, pageFuzzy = 1, lastQuery = '';
const debounce = (fn, ms=300)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};

const API_BASE_URL = 'https://a39df363-c1c8-4bcc-91da-93451029a018-00-1g54chxlooa5m.spock.replit.dev';

async function fetchWithFallback(relUrl){
  const url = relUrl.startsWith('http') ? relUrl : `${API_BASE_URL}${relUrl}`;
  try { 
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }); 
    if(!r.ok) throw new Error('HTTP '+r.status); 
    return r; 
  } catch(e){ 
    console.error('Fetch error:', e);
    throw e;
  }
}

function showStatus(s){ statusEl.textContent = s || '—' }
function formatPrice(raw, currency){ if(raw==null) return null; const n=Number(raw); if(!isFinite(n)) return null; return n.toFixed(2)+(currency?(' '+currency):''); }
function badgeForSource(src){ if(!src) return ''; if(src==='imported') return 'سعر وارد'; if(src==='imported_fuzzy') return 'سعر وارد (مطابق تقريبي)'; if(src==='estimated_ai') return 'سعر مُقدّر (نفس المادة)'; if(src==='estimated_sim') return 'سعر مُقدّر (تشابه اسم)'; return src; }

function renderList(container, rows){
  if(!rows || rows.length===0){ container.innerHTML = '<div class="meta">لا توجد نتائج</div>'; return; }
  container.innerHTML = '';
  rows.forEach(r=>{
    const card = document.createElement('div'); card.className='card';
    const imgWrap = document.createElement('div'); imgWrap.style.width='88px'; imgWrap.style.marginLeft='12px';
    const img = document.createElement('img'); img.style.width='88px'; img.style.height='88px'; img.style.objectFit='contain'; img.style.borderRadius='8px';
    img.src = r.image_url || 'placeholder.png';
    imgWrap.appendChild(img);
    const left = document.createElement('div'); left.style.flex='1';
    const title = document.createElement('h4'); title.textContent = r.trade_name || '—';
    const ai = document.createElement('div'); ai.className='meta'; ai.textContent = 'المادة الفعالة: ' + (r.active_ingredient || '—');
    left.appendChild(title); left.appendChild(ai);
    const right = document.createElement('div'); right.style.textAlign='right';
    const priceText = formatPrice(r.avg_price, r.currency);
    if(priceText){ const p = document.createElement('div'); p.className='price'; p.textContent=priceText; right.appendChild(p); const b=badgeForSource(r.price_source); if(b){ const bb=document.createElement('div'); bb.className='badge'; bb.textContent=b; bb.style.marginTop='8px'; right.appendChild(bb);} }
    else{ const p=document.createElement('div'); p.className='meta'; p.textContent='السعر غير متوفر'; right.appendChild(p); }
    card.appendChild(imgWrap); card.appendChild(left); card.appendChild(right);
    card.style.display='flex'; card.style.alignItems='center';
    container.appendChild(card);
  });
}

function renderPager(container, current, onPage){ container.innerHTML=''; const prev=document.createElement('button'); prev.className='btn'; prev.textContent='السابق'; prev.disabled=current<=1; prev.onclick=()=>onPage(Math.max(1,current-1)); const info=document.createElement('div'); info.className='meta'; info.textContent=`صفحة ${current}`; const next=document.createElement('button'); next.className='btn'; next.textContent='التالي'; next.onclick=()=>onPage(current+1); container.appendChild(prev); container.appendChild(info); container.appendChild(next); }

async function search(q, page=1, per_page=50){
  showStatus('جاري البحث...'); exactEl.innerHTML=''; fuzzyEl.innerHTML='';
  try {
    const allergen = (allergenEl.value || '').trim().toLowerCase();
    const rel = `/api/search?q=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}` + (allergen ? `&exclude=${encodeURIComponent(allergen)}` : '');
    const res = await fetchWithFallback(rel);
    const data = await res.json();
    const metaPage = data && data.meta && Number.isFinite(Number(data.meta.page)) ? Number(data.meta.page) : page;
    renderList(exactEl, data.exact || []); renderPager(document.getElementById('pager-exact'), metaPage, (p)=>{ pageExact=p; doSearch(); });
    renderList(fuzzyEl, data.fuzzy || []); renderPager(document.getElementById('pager-fuzzy'), metaPage, (p)=>{ pageFuzzy=p; doSearch(); });
    showStatus(`عرض نتائج لـ "${q}"`); try{ const m=(res.url||'').match(/:(\d+)\//); document.getElementById('port-indicator').textContent = m?m[1]:(location.port||'—'); }catch(e){}
  } catch(err){ console.error(err); showStatus('خطأ في الاتصال بالسيرفر'); exactEl.innerHTML=''; fuzzyEl.innerHTML=''; }
}

const doSearch = debounce(()=>{ const q=qEl.value.trim(); if(!q) return; const per=Number(perPageEl.value)||50; const pageToUse=Math.max(pageExact||1,pageFuzzy||1); search(q,pageToUse,per); },300);

if (qEl) {
  qEl.addEventListener('keydown', e=>{ if(e.key==='Enter'){ pageExact=1; pageFuzzy=1; doSearch(); }});
  qEl.addEventListener('input', ()=>{ pageExact=1; pageFuzzy=1; doSearch(); });
  qEl.focus();
}
if (allergenEl) allergenEl.addEventListener('change', ()=>{ if(qEl.value.trim()) doSearch(); });
if (perPageEl) perPageEl.addEventListener('change', ()=>{ if(qEl.value.trim()) doSearch(); });

showStatus('جاهز');
