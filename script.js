// ============================================================
// script.js — Data Area North (FINAL FIX)
// ✅ ลบ tableHasRows() ที่ทำให้พลาดข้อมูล
// ✅ โหลดข้อมูลตรงด้วย select('*')
// ============================================================

const SUPABASE_URL = 'https://zfnualnoorhtdkrqwjpa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbnVhbG5vb3JodGRrcnF3anBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDkyNzEsImV4cCI6MjA5MDQyNTI3MX0._XuqPMrt9_Rx5aFybAqrxmKrlnU5g4JzKKz3aK2SORg';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── MOCKUP COORDINATES ──────────────────────────────────────
const PROVINCE_COORDS = {
  'เชียงใหม่': [18.787, 98.993], 'เชียงราย': [19.910, 99.840],
  'ลำปาง': [18.289, 99.490],     'ลำพูน': [18.574, 99.009],
  'แม่ฮ่องสอน': [19.302, 97.964], 'พะเยา': [19.163, 99.901],
  'แพร่': [18.144, 100.140],     'น่าน': [18.783, 100.777],
  'อุตรดิตถ์': [17.620, 100.099], 'ตาก': [16.879, 99.126],
  'สุโขทัย': [17.007, 99.826],   'พิษณุโลก': [16.822, 100.265],
  'เพชรบูรณ์': [16.419, 101.159], 'กำแพงเพชร': [16.484, 99.522],
  'พิจิตร': [16.441, 100.349],   'นครสวรรค์': [15.703, 100.137],
  'อุทัยธานี': [15.380, 100.025], 'ชัยนาท': [15.185, 100.125],
};

// ── STATE ───────────────────────────────────────────────────
let mainMap = null, mainLayer = null, publicMap = null;
let allCharters = [], allLW = [];
let charterPage = 1, lwPage = 1;
const PAGE = 20;

// ── UTILS ───────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const tx = (id, v) => { const e = $(id); if (e) e.textContent = v ?? '—'; };
const hx = (id, v) => { const e = $(id); if (e) e.innerHTML = v; };

function rowLoading(id, cols) {
  hx(id, `<tr><td colspan="${cols}" class="td-center" style="color:#aaa;">🔄 กำลังโหลด...</td></tr>`);
}
function rowEmpty(id, msg, cols) {
  hx(id, `<tr><td colspan="${cols}" class="td-center" style="color:#aaa;">🔍 ${msg}</td></tr>`);
}

function thDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()];
    return `${d.getDate()} ${m} ${d.getFullYear()+543}`;
  } catch { return val; }
}
function thYear(val) {
  if (!val) return '—';
  try { return new Date(val).getFullYear()+543; } catch { return '—'; }
}

function buildOptions(items, allLabel) {
  const uniq = [...new Set(items?.filter(Boolean)?.map(String) || [])].sort((a,b) =>
    isNaN(a) ? String(a).localeCompare(String(b),'th') : b-a);
  return `<option value="all">${allLabel}</option>` +
    uniq.map(v => `<option value="${v}">${v}</option>`).join('');
}

function fillSelect(id, items, allLabel) {
  const el = $(id); if (!el) return;
  const prev = el.value;
  el.innerHTML = buildOptions(items, allLabel);
  if (prev && prev !== 'all') el.value = prev;
}

function cleanName(name) {
  if (!name) return null;
  return String(name).trim().replace(/^จ\.?\s*/i, '').replace(/\s+/g, ' ').trim();
}

// ── MOCK COORDS ─────────────────────────────────────────────
function strHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31,h) + s.charCodeAt(i)) | 0;
  return h;
}

function mockCoords(province, district, subdistrict) {
  const base = PROVINCE_COORDS[province];
  if (!base) return null;
  const [lat, lng] = base;
  const dh = strHash((district||'') + province);
  const sh = strHash((subdistrict||'') + (district||'') + province);
  const dLat = ((dh & 0xFF)/255 - 0.5) * 0.7;
  const dLng = (((dh>>8) & 0xFF)/255 - 0.5) * 0.7;
  const sLat = ((sh & 0xFF)/255 - 0.5) * 0.18;
  const sLng = (((sh>>8) & 0xFF)/255 - 0.5) * 0.18;
  return [+(lat+dLat+sLat).toFixed(5), +(lng+dLng+sLng).toFixed(5)];
}

// ── MAP INIT ────────────────────────────────────────────────
function initMainMap() {
  const el = $('leaflet-map');
  if (!el || mainMap) return;
  
  mainMap = L.map('leaflet-map', { center:[17.8,99.8], zoom:7, scrollWheelZoom:true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OpenStreetMap', maxZoom:18
  }).addTo(mainMap);
  
  mainLayer = L.layerGroup().addTo(mainMap);

  const leg = L.control({ position:'bottomright' });
  leg.onAdd = () => {
    const d = L.DomUtil.create('div');
    d.style.cssText = 'background:white;padding:8px 12px;border-radius:8px;font-size:11px;color:#444;line-height:1.9;border:0.5px solid rgba(0,0,0,0.1);';
    d.innerHTML = `<b style="font-size:12px;">สัญลักษณ์</b><br>
      <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#1D9E75;margin-right:5px;vertical-align:middle;border:2px solid white;"></span>ธรรมนูญสุขภาพ`;
    return d;
  };
  leg.addTo(mainMap);
}

// ── BUILD MARKERS ───────────────────────────────────────────
function buildMarkers(data, groupBy) {
  if (!mainMap || !mainLayer || !data?.length) {
    console.warn('⚠️ ไม่มีข้อมูลหรือแผนที่ไม่พร้อม');
    return;
  }
  
  mainLayer.clearLayers();
  const groups = {};
  const skippedProvinces = new Set(); // เก็บรายชื่อจังหวัดที่ทำ Marker ไม่ได้

  data.forEach(r => {
    const prov = cleanName(r?.province);
    
    // ✅ เช็คตรงนี้: ถ้าไม่มีพิกัด จะไม่สร้างกลุ่ม
    if (!prov || !PROVINCE_COORDS[prov]) {
      if (prov) skippedProvinces.add(prov); // เก็บไว้ดูภายหลัง
      return; 
    }
    
    const key = groupBy === 'subdistrict' ? `${r?.subdistrict}||${r?.district}||${prov}`
              : groupBy === 'district'    ? `${r?.district}||${prov}`
              :                             prov;
              
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  // 🚨 แจ้งเตือนใน Console ถ้ามีจังหวัดที่ไม่มีพิกัด
  if (skippedProvinces.size > 0) {
    console.error('❌ พบจังหวัดที่ไม่มีพิกัดใน PROVINCE_COORDS:', [...skippedProvinces]);
    console.log('💡 คำแนะนำ: เพิ่มจังหวัดเหล่านี้ลงในตัวแปร PROVINCE_COORDS ด้านบนสุดของไฟล์');
  }

  Object.entries(groups).forEach(([key, rows]) => {
    const r0 = rows[0];
    const prov = cleanName(r0?.province);
    const coords = groupBy === 'province' 
      ? PROVINCE_COORDS[prov]
      : mockCoords(prov, r0?.district, groupBy === 'subdistrict' ? r0?.subdistrict : null);
    
    if (!coords) return;

    const cnt = rows.length;
    const label = groupBy === 'province' ? prov : (r0?.district || prov);
    const sz = cnt >= 10 ? 42 : 36;
    const bg = cnt >= 10 ? '#0F6E56' : cnt >= 5 ? '#1D9E75' : '#5DCAA5';

    const icon = L.divIcon({
      className:'',
      html: `<div style="width:${sz}px;height:${sz}px;background:${bg};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:${cnt>=10?13:11}px;font-weight:600;cursor:pointer;">${cnt}</div>`,
      iconSize:[sz,sz], iconAnchor:[sz/2,sz/2],
    });

    const m = L.marker(coords, { icon }).addTo(mainLayer);
    m.bindTooltip(`<b>${label}</b><br><span style="font-size:11px;">${cnt} ธรรมนูญสุขภาพ</span>`, { direction:'top', offset:[0,-sz/2-4], opacity:0.95 });
    m.on('click', () => openMapModal(label, rows));
  });
  
  console.log(`📍 Markers created: ${Object.keys(groups).length} locations`);
}

// ── MAP FILTER ──────────────────────────────────────────────
function applyMapFilter() {
  const prov = $('mf-province')?.value || 'all';
  const dist = $('mf-district')?.value || 'all';
  const sub  = $('mf-subdistrict')?.value || 'all';

  let filtered = allCharters || [];
  if (prov !== 'all') filtered = filtered.filter(r => cleanName(r?.province) === cleanName(prov));
  if (dist !== 'all') filtered = filtered.filter(r => r?.district === dist);
  if (sub  !== 'all') filtered = filtered.filter(r => r?.subdistrict === sub);

  const groupBy = sub !== 'all' ? 'subdistrict' : dist !== 'all' ? 'district' : prov !== 'all' ? 'district' : 'province';
  buildMarkers(filtered, groupBy);

  if (prov !== 'all' && PROVINCE_COORDS[prov]) {
    mainMap.setView(PROVINCE_COORDS[prov], dist !== 'all' ? 10 : 9);
  } else {
    mainMap.setView([17.8,99.8], 7);
  }

  const bySub = prov === 'all' ? allCharters : allCharters.filter(r => cleanName(r?.province) === cleanName(prov));
  fillSelect('mf-district', bySub?.map(r => r?.district), 'ทุกอำเภอ');
  const byDist = dist === 'all' ? bySub : bySub.filter(r => r?.district === dist);
  fillSelect('mf-subdistrict', byDist?.map(r => r?.subdistrict), 'ทุกตำบล');
}

function bindMapFilters() {
  ['mf-province','mf-district','mf-subdistrict'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('change', applyMapFilter);
  });
}

// ── MAP MODAL ───────────────────────────────────────────────
function openMapModal(groupName, rows) {
  let ov = $('map-modal-ov');
  if (!ov) {
    ov = document.createElement('div'); 
    ov.id = 'map-modal-ov';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.addEventListener('click', e => { if (e.target===ov) closeMapModal(); });
    document.body.appendChild(ov);
  }

  const items = (rows || []).map(r => {
    const name = r?.charter_name || r?.title || '(ไม่มีชื่อ)';
    const prov = r?.province || '—';
    const dist = r?.district || '—';
    const sub = r?.subdistrict || '';
    const pubDate = r?.publish_date || null;
    
    return `
    <div style="border:0.5px solid rgba(0,0,0,0.1);border-radius:8px;padding:11px 14px;background:#fafaf8;margin-bottom:8px;">
      <div style="font-size:13px;font-weight:500;color:#1a1a1a;margin-bottom:6px;">${name}</div>
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <tr><td style="color:#888;padding:2px 0;width:80px;">จังหวัด</td><td style="color:#444;">${prov}</td></tr>
        <tr><td style="color:#888;padding:2px 0;">อำเภอ / ตำบล</td><td style="color:#444;">${dist}${sub ? ' · '+sub : ''}</td></tr>
        <tr><td style="color:#888;padding:2px 0;">วันที่เผยแพร่</td><td style="color:#444;">${thDate(pubDate)}</td></tr>
      </table>
    </div>`;
  }).join('');

  ov.innerHTML = `
    <div style="background:white;border-radius:12px;width:100%;max-width:520px;max-height:86vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:0.5px solid rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div>
          <div style="font-size:15px;font-weight:500;color:#1a1a1a;">📍 ${groupName}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">${rows?.length || 0} ธรรมนูญสุขภาพ</div>
        </div>
        <button onclick="closeMapModal()" style="border:none;background:none;cursor:pointer;font-size:20px;color:#aaa;line-height:1;">✕</button>
      </div>
      <div style="padding:12px 16px 16px;overflow-y:auto;flex:1;">
        ${items || '<div style="text-align:center;padding:32px;color:#aaa;">ไม่พบข้อมูล</div>'}
      </div>
      <div style="padding:10px 18px;border-top:0.5px solid rgba(0,0,0,0.08);display:flex;justify-content:flex-end;flex-shrink:0;">
        <button onclick="closeMapModal()" style="padding:7px 20px;border:0.5px solid rgba(0,0,0,0.2);border-radius:6px;background:white;color:#444;font-size:13px;cursor:pointer;">ปิด</button>
      </div>
    </div>`;
  ov.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeMapModal() {
  const e = $('map-modal-ov'); 
  if (e) e.style.display='none';
  document.body.style.overflow = '';
}

// ── OVERVIEW KPIs ───────────────────────────────────────────
async function loadKPIs() {
  try {
    const { data, error } = await db.from('data_charter').select('province');
    if (error) {
      console.error('loadKPIs error:', error.message);
      throw error;
    }
    const rows = data || [];
    console.log(`📊 KPI: loaded ${rows.length} charters`);
    tx('kpi-provinces', new Set(rows.map(r=>r?.province).filter(Boolean)).size);
    tx('kpi-charter-total', rows.length.toLocaleString('th-TH'));
  } catch(e) {
    console.error('loadKPIs failed:', e.message);
    tx('kpi-provinces', '0');
    tx('kpi-charter-total', '0');
  }
}

// ── PRELOAD CHARTERS (✅ โหลดตรง ไม่ตรวจสอบล่วงหน้า) ────────
async function preloadCharters() {
  try {
    console.log('📥 Loading data_charter...');
    const { data, error } = await db.from('data_charter').select('*');
    
    if (error) {
      console.error('❌ data_charter error:', error.message);
      throw error;
    }
    
    allCharters = data || [];
    console.log(`✅ data_charter loaded: ${allCharters.length} records`);
    
    // แสดงตัวอย่างข้อมูล 3 รายการแรก
    if (allCharters.length > 0) {
      console.log('📋 Sample data:', allCharters.slice(0, 3));
    }
    
  } catch (e) {
    console.error('❌ preloadCharters failed:', e.message);
    allCharters = [];
  }
}

// ── CHARTER TABLE ───────────────────────────────────────────
async function loadCharterTable(reset=true) {
  if (reset) charterPage = 1;
  rowLoading('charter-tbody', 7);

  try {
    const prov  = $('cf-province')?.value || 'all';
    const dist  = $('cf-district')?.value || 'all';
    const sub   = $('cf-subdistrict')?.value || 'all';
    const yr    = $('cf-year')?.value || 'all';
    const q     = $('cf-search')?.value?.trim() || '';

    let query = db.from('data_charter')
      .select('*', { count:'exact' })
      .order('publish_date', { ascending:false, nullsFirst:true })
      .range((charterPage-1)*PAGE, charterPage*PAGE-1);

    if (prov !== 'all') query = query.eq('province', prov);
    if (yr !== 'all') {
      const y = parseInt(yr) - 543;
      query = query.gte('publish_date',`${y}-01-01`).lte('publish_date',`${y}-12-31`);
    }

    const { data, count, error } = await query;
    
    if (error) throw error;

    let filtered = data || [];
    if (dist !== 'all') filtered = filtered.filter(r => r?.district === dist);
    if (sub  !== 'all') filtered = filtered.filter(r => r?.subdistrict === sub);
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(r => 
        (r?.charter_name?.toLowerCase()?.includes(term)) ||
        (r?.province?.toLowerCase()?.includes(term)) ||
        (r?.district?.toLowerCase()?.includes(term))
      );
    }

    renderCharterTable(filtered, filtered.length);

  } catch(e) {
    console.error('loadCharterTable:', e.message);
    rowEmpty('charter-tbody', 'โหลดไม่สำเร็จ: ' + e.message, 7);
  }
}

function renderCharterTable(data, count) {
  if (!data?.length) {
    rowEmpty('charter-tbody', 'ไม่พบข้อมูลตามเงื่อนไข', 7);
    tx('charter-count','ไม่พบข้อมูล');
    hx('charter-pager','');
    return;
  }

  $('charter-tbody').innerHTML = data.map(r => {
    const name = r?.charter_name || '(ไม่มีชื่อ)';
    const prov = r?.province || '—';
    const dist = r?.district || '—';
    const sub = r?.subdistrict || '—';
    const year = thYear(r?.publish_date);
    
    return `
      <tr>
        <td style="padding:6px 8px;"><div style="width:40px;height:40px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#888;">📄</div></td>
        <td class="td-name" title="${name}">${name}</td>
        <td>${prov}</td>
        <td>${dist}</td>
        <td>${sub}</td>
        <td>${year}</td>
        <td><button class="btn-sm" onclick="alert('ดูรายละเอียด: ${name}')">ดู</button></td>
      </tr>`;
  }).join('');

  const total = count || data.length;
  const from = (charterPage-1)*PAGE + 1;
  const to = Math.min(charterPage*PAGE, total);
  const tp = Math.ceil(total/PAGE);
  tx('charter-count', `แสดง ${from}–${to} จาก ${total.toLocaleString('th-TH')} รายการ`);
  renderPager('charter-pager', charterPage, tp, 'charterPrev','charterNext');
}

function charterPrev() { if(charterPage>1){ charterPage--; loadCharterTable(false); } }
function charterNext(tp) { if(charterPage<tp){ charterPage++; loadCharterTable(false); } }

function bindCharterFilters() {
  $('cf-search-btn')?.addEventListener('click', () => loadCharterTable(true));
  $('cf-search')?.addEventListener('keydown', e => { if(e.key==='Enter') loadCharterTable(true); });

  $('cf-province')?.addEventListener('change', () => {
    const p = $('cf-province').value;
    const s = p==='all' ? allCharters : allCharters.filter(r => cleanName(r?.province) === cleanName(p));
    fillSelect('cf-district', s?.map(r=>r?.district), 'ทุกอำเภอ');
    fillSelect('cf-subdistrict', s?.map(r=>r?.subdistrict), 'ทุกตำบล');
  });
}

// ── POPULATE CHARTER FILTERS ────────────────────────────────
function populateCharterFilters() {
  console.log('📋 Populating filters with', allCharters?.length, 'charters');
  fillSelect('mf-province', allCharters?.map(r=>r?.province), 'ทุกจังหวัด');
  fillSelect('mf-district', allCharters?.map(r=>r?.district), 'ทุกอำเภอ');
  fillSelect('mf-subdistrict', allCharters?.map(r=>r?.subdistrict), 'ทุกตำบล');
  fillSelect('cf-province', allCharters?.map(r=>r?.province), 'ทุกจังหวัด');
  fillSelect('cf-district', allCharters?.map(r=>r?.district), 'ทุกอำเภอ');
  fillSelect('cf-subdistrict', allCharters?.map(r=>r?.subdistrict), 'ทุกตำบล');

  const years = [...new Set(allCharters?.map(r=>r?.publish_date?thYear(r.publish_date):null).filter(Boolean) || [])].sort((a,b)=>b-a);
  const ys = $('cf-year');
  if (ys) ys.innerHTML = '<option value="all">ทุกปี</option>' + years.map(y=>`<option value="${y}">${y}</option>`).join('');
}

// ── LIVING WILL ─────────────────────────────────────────────
async function preloadLW() {
  try {
    console.log('📥 Loading data_living_will...');
    const { data, error } = await db.from('data_living_will').select('*');
    
    if (error) {
      console.warn('⚠️ data_living_will error:', error.message);
      allLW = [];
      return;
    }
    
    allLW = data || [];
    console.log(`✅ data_living_will loaded: ${allLW.length} records`);
    
  } catch(e) {
    console.warn('⚠️ preloadLW failed:', e.message);
    allLW = [];
  }
}

function populateLWFilters() {
  if (!allLW?.length) return;
  fillSelect('lw-province', allLW?.map(r=>r?.province), 'ทุกจังหวัด');
  fillSelect('lw-district', allLW?.map(r=>r?.district), 'ทุกอำเภอ');
  fillSelect('lw-subdistrict', allLW?.map(r=>r?.subdistrict), 'ทุกตำบล');
}

async function loadLWTable(reset=true) {
  if (reset) lwPage = 1;
  rowLoading('lw-tbody', 6);

  try {
    const { data, count, error } = await db
      .from('data_living_will')
      .select('*', { count:'exact' })
      .order('year', { ascending:false, nullsFirst:true })
      .range((lwPage-1)*PAGE, lwPage*PAGE-1);

    if (error) throw error;

    if (!data?.length) {
      rowEmpty('lw-tbody', 'ไม่มีข้อมูล Living Will', 6);
      tx('lw-count','');
      hx('lw-pager','');
      return;
    }

    $('lw-tbody').innerHTML = data.map(r => `
      <tr>
        <td class="td-name">${r?.name || r?.full_name || '—'}</td>
        <td>${r?.province || '—'}</td>
        <td>${r?.district || '—'}</td>
        <td>${r?.subdistrict || '—'}</td>
        <td>${r?.year || '—'}</td>
        <td>${r?.channel || '—'}</td>
      </tr>`).join('');

    const total = count || data.length;
    const from = (lwPage-1)*PAGE + 1;
    const to = Math.min(lwPage*PAGE, total);
    const tp = Math.ceil(total/PAGE);
    tx('lw-count', `แสดง ${from}–${to} จาก ${total.toLocaleString('th-TH')} รายการ`);
    renderPager('lw-pager', lwPage, tp, 'lwPrev','lwNext');

  } catch(e) {
    console.warn('loadLWTable:', e.message);
    rowEmpty('lw-tbody', 'ยังไม่มีข้อมูล Living Will', 6);
  }
}

function lwPrev() { if(lwPage>1){ lwPage--; loadLWTable(false); } }
function lwNext(tp) { if(lwPage<tp){ lwPage++; loadLWTable(false); } }
function bindLWFilters() {
  $('lw-search-btn')?.addEventListener('click', () => loadLWTable(true));
}

// ── PAGER ───────────────────────────────────────────────────
function renderPager(id, page, total, prevFn, nextFn) {
  const el = $(id); if (!el) return;
  el.innerHTML = `
    <button onclick="${prevFn}()" class="pager-btn" ${page<=1?'disabled':''}>‹ ก่อนหน้า</button>
    <span class="pager-info">หน้า ${page} / ${total}</span>
    <button onclick="${nextFn}(${total})" class="pager-btn" ${page>=total?'disabled':''}>ถัดไป ›</button>`;
}

// ── PUBLIC MAP ──────────────────────────────────────────────
function initPublicMap() {
  const el = $('public-leaflet-map');
  if (!el || publicMap) return;

  publicMap = L.map('public-leaflet-map', { center:[17.8,99.8], zoom:7, scrollWheelZoom:false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OpenStreetMap', maxZoom:18
  }).addTo(publicMap);

  const byProv = {};
  (allCharters || []).forEach(r => { 
    const p = cleanName(r?.province);
    if (p) byProv[p] = (byProv[p]||0)+1; 
  });

  Object.entries(byProv).forEach(([prov, cnt]) => {
    const coords = PROVINCE_COORDS[prov]; 
    if (!coords) return;
    const icon = L.divIcon({
      className:'',
      html:`<div style="width:32px;height:32px;background:#378ADD;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:600;">${cnt}</div>`,
      iconSize:[32,32], iconAnchor:[16,16],
    });
    L.marker(coords, { icon })
      .addTo(publicMap)
      .bindTooltip(`<b>จ.${prov}</b><br>${cnt} จุดให้บริการ`, { direction:'top' });
  });
}

// ── KEYBOARD ESC ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMapModal(); }
});

// ── INIT ────────────────────────────────────────────────────
async function initDashboard() {
  console.log('🚀 Initializing Dashboard...');
  
  // 1. โหลดข้อมูล
  await Promise.all([preloadCharters(), preloadLW()]);
  
  // 2. Populate filters
  populateCharterFilters();
  populateLWFilters();

  // 3. Init map
  initMainMap();
  if (allCharters?.length) {
    buildMarkers(allCharters, 'province');
  } else {
    console.warn('⚠️ No charter data to display on map');
  }

  // 4. Load sections
  await Promise.all([loadKPIs(), loadCharterTable(), loadLWTable()]);
  
  // 5. Bind filters
  bindMapFilters();
  bindCharterFilters();
  bindLWFilters();
  
  // 6. Public map
  initPublicMap();
  
  console.log('✅ Dashboard Ready');
  console.log('📊 Summary:', {
    charters: allCharters?.length || 0,
    living_wills: allLW?.length || 0
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);

// ── EXPORT ──────────────────────────────────────────────────
window.NorthernHealthPlatform = {
  loadCharterTable,
  loadLWTable,
  buildMarkers: () => buildMarkers(allCharters, 'province'),
};