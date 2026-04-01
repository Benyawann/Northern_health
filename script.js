// ============================================================
// script.js — Northern Health Data Platform
// Supabase (data_north) + Leaflet Map + Modal
// ============================================================

const SUPABASE_URL = 'https://zfnualnoorhtdkrqwjpa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbnVhbG5vb3JodGRrcnF3anBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDkyNzEsImV4cCI6MjA5MDQyNTI3MX0._XuqPMrt9_Rx5aFybAqrxmKrlnU5g4JzKKz3aK2SORg'; // ← ใส่ legacy anon key ที่นี่

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── พิกัด 17 จังหวัดภาคเหนือ + จังหวัดอื่นที่อาจมีในDB ─────
const PROVINCE_COORDS = {
  'เชียงใหม่':  [18.787, 98.993],
  'เชียงราย':   [19.910, 99.840],
  'ลำปาง':      [18.289, 99.490],
  'ลำพูน':      [18.574, 99.009],
  'แม่ฮ่องสอน': [19.302, 97.964],
  'พะเยา':      [19.163, 99.901],
  'แพร่':       [18.144, 100.140],
  'น่าน':       [18.783, 100.777],
  'อุตรดิตถ์':  [17.620, 100.099],
  'ตาก':        [16.879, 99.126],
  'สุโขทัย':    [17.007, 99.826],
  'พิษณุโลก':   [16.822, 100.265],
  'เพชรบูรณ์':  [16.419, 101.159],
  'กำแพงเพชร':  [16.484, 99.522],
  'พิจิตร':     [16.441, 100.349],
  'นครสวรรค์':  [15.703, 100.137],
  'อุทัยธานี':  [15.380, 100.025],
  'ชัยนาท':     [15.185, 100.125],
};

// ── MAP + STATE ───────────────────────────────────────────────
let mapInstance    = null;
let allCharterData = [];

// ── UTILS ────────────────────────────────────────────────────

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showLoading(id, cols = 1) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:20px;color:#aaa;">กำลังโหลด...</td></tr>`;
}

function showError(id, msg, cols = 1) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:20px;color:#E24B4A;">${msg}</td></tr>`;
}

function formatDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return val; }
}

// ── COORDS UTILS ─────────────────────────────────────────────

/**
 * สร้าง HTML แสดงพิกัดจังหวัด + ปุ่มคัดลอก + ลิงก์แผนที่
 */
function buildCoordsStrip(province) {
  const coords = PROVINCE_COORDS[province];
  if (!coords) return '';
  
  const [lat, lng] = coords;
  const latStr = lat.toFixed(4) + '° N';
  const lngStr = lng.toFixed(4) + '° E';
  const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=10`;
  const copyVal = `${lat}, ${lng}`;
  
  // Mini map visualization (SVG)
  const miniMap = `
    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="64" fill="#ddecd5"/>
      <path d="M10 20 Q20 12 35 18 Q50 24 60 16 Q68 10 75 18 L75 50 Q65 42 55 46 Q40 52 25 44 Q14 38 10 44Z" fill="#c5dfb8" opacity="0.8"/>
      <circle cx="40" cy="30" r="7" fill="#1D9E75" opacity="0.9"/>
      <circle cx="40" cy="30" r="3.5" fill="white"/>
      <circle cx="40" cy="30" r="11" stroke="#1D9E75" stroke-width="1" fill="none" opacity="0.35"/>
      <text x="40" y="58" text-anchor="middle" font-size="8" fill="#3B6D11" font-family="sans-serif" font-weight="500">${province}</text>
    </svg>`;
  
  return `
    <div style="
      margin:10px 20px;
      background:#f7f9f7;
      border:0.5px solid rgba(0,0,0,0.1);
      border-radius:8px;
      padding:10px 14px;
      display:flex;
      align-items:center;
      gap:14px;
    ">
      <div style="flex:1;min-width:0;">
        <div style="font-size:10px;color:#888;font-weight:500;margin-bottom:5px;">📍 พิกัดจังหวัด</div>
        <div style="display:flex;gap:16px;margin-bottom:6px;">
          <div>
            <div style="font-size:9px;color:#aaa;margin-bottom:1px;">Latitude</div>
            <div style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:monospace;">${latStr}</div>
          </div>
          <div>
            <div style="font-size:9px;color:#aaa;margin-bottom:1px;">Longitude</div>
            <div style="font-size:13px;font-weight:500;color:#1a1a1a;font-family:monospace;">${lngStr}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer"
            style="font-size:11px;color:#185FA5;background:#E6F1FB;padding:2px 9px;border-radius:4px;text-decoration:none;">
            Google Maps ↗
          </a>
          <span onclick="copyCoords('${copyVal}', this)"
            style="font-size:11px;color:#555;background:white;border:0.5px solid rgba(0,0,0,0.15);padding:2px 9px;border-radius:4px;cursor:pointer;">
            คัดลอกพิกัด
          </span>
        </div>
      </div>
      <div style="width:80px;height:64px;border-radius:6px;border:0.5px solid rgba(0,0,0,0.1);overflow:hidden;flex-shrink:0;">
        ${miniMap}
      </div>
    </div>`;
}

/**
 * คัดลอกพิกัดลง Clipboard
 */
function copyCoords(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = el.textContent;
    el.textContent = 'คัดลอกแล้ว ✓';
    el.style.color = '#1D9E75';
    setTimeout(() => { el.textContent = orig; el.style.color = ''; }, 1800);
  }).catch(() => {
    // Fallback สำหรับเบราว์เซอร์เก่า
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    el.textContent = 'คัดลอกแล้ว ✓';
    setTimeout(() => el.textContent = 'คัดลอกพิกัด', 1800);
  });
}

function copyCoords(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = el.textContent;
    el.textContent = 'คัดลอกแล้ว ✓';
    el.style.color = '#1D9E75';
    setTimeout(() => { el.textContent = orig; el.style.color = ''; }, 1800);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    el.textContent = 'คัดลอกแล้ว ✓';
    setTimeout(() => el.textContent = 'คัดลอกพิกัด', 1800);
  });
}

// ── MODAL (แสดงพิกัด + แหล่งข้อมูล) ────────────────────────────

function openModal(province, rows) {
  let overlay = document.getElementById('charter-modal-overlay');
  
  // สร้าง overlay ถ้ายังไม่มี
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'charter-modal-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;
      background:rgba(0,0,0,0.45);
      z-index:9000;
      display:flex;align-items:center;justify-content:center;
      padding:16px;
    `;
    overlay.addEventListener('click', e => { 
      if (e.target === overlay) closeModal(); 
    });
    document.body.appendChild(overlay);
  }

  const count = rows.length;
  
  // นับข้อมูลแยกตามแหล่งที่มา
  const sourceCount = {
    north: rows.filter(r => r._source === 'data_north').length,
    kampaeng: rows.filter(r => r._source === 'data_kampaengphet').length,
    chainat: rows.filter(r => r._source === 'data_chainat').length
  };

  // สร้างรายการธรรมนูญ
  const rowsHtml = rows.map(row => {
    // Badge แสดงแหล่งข้อมูล
    const sourceBadge = row._source === 'data_kampaengphet' 
      ? `<span style="background:#E6F1FB;color:#378ADD;font-size:10px;padding:2px 6px;border-radius:4px;">กำแพงเพชร</span>`
      : row._source === 'data_chainat'
        ? `<span style="background:#FFF4E6;color:#EF9F27;font-size:10px;padding:2px 6px;border-radius:4px;">ชัยนาท</span>`
        : `<span style="background:#E1F5EE;color:#1D9E75;font-size:10px;padding:2px 6px;border-radius:4px;">ภาคเหนือ</span>`;
    
    return `
    <div style="border:0.5px solid rgba(0,0,0,0.1);border-radius:8px;padding:12px 14px;background:#fafaf8;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:500;color:#1a1a1a;flex:1;">
          ${row.charter_name || row.title || '(ไม่มีชื่อ)'}
        </div>
        ${sourceBadge}
      </div>
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <tr>
          <td style="color:#888;padding:2px 0;width:90px;">อำเภอ / ตำบล</td>
          <td style="color:#444;">${row.district || '—'}${row.subdistrict ? ' · ' + row.subdistrict : ''}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:2px 0;">ผู้นำ</td>
          <td style="color:#444;">${row.leader || '—'}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:2px 0;">ผู้สนับสนุน</td>
          <td style="color:#444;">${row.academic_supporter || '—'}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:2px 0;">วันที่เผยแพร่</td>
          <td style="color:#444;">${formatDate(row.publish_date)}</td>
        </tr>
      </table>
    </div>
  `;
  }).join('');

  // แสดงสถิติแหล่งข้อมูล
  const sourceStats = Object.entries(sourceCount)
    .filter(([,v]) => v > 0)
    .map(([src, val]) => {
      const label = src === 'north' ? 'ภาคเหนือ' : src === 'kampaeng' ? 'กำแพงเพชร' : 'ชัยนาท';
      const color = src === 'north' ? '#1D9E75' : src === 'kampaeng' ? '#378ADD' : '#EF9F27';
      return `<span style="background:${color}20;color:${color};font-size:10px;padding:2px 8px;border-radius:4px;margin-right:4px;">${label}: ${val}</span>`;
    }).join('');

  // สร้างเนื้อหา Modal
  overlay.innerHTML = `
    <div style="
      background:white;border-radius:12px;
      width:100%;max-width:540px;max-height:85vh;
      display:flex;flex-direction:column;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;
    ">
      <!-- Header -->
      <div style="padding:16px 20px;border-bottom:0.5px solid rgba(0,0,0,0.1);display:flex;align-items:center;gap:12px;flex-shrink:0;">
        <div style="width:36px;height:36px;border-radius:8px;background:#E1F5EE;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5L16.5 6.75V16.5H1.5V6.75L9 1.5Z" stroke="#1D9E75" stroke-width="1.4" stroke-linejoin="round" fill="none"/>
            <rect x="6" y="10" width="6" height="6.5" rx="1" stroke="#1D9E75" stroke-width="1.2" fill="none"/>
          </svg>
        </div>
        <div style="flex:1;">
          <div style="font-size:16px;font-weight:500;color:#1a1a1a;">จ.${province}</div>
          <div style="font-size:12px;color:#888;">${count} ธรรมนูญสุขภาพ</div>
        </div>
        <button onclick="closeModal()" style="border:none;background:none;cursor:pointer;font-size:20px;color:#aaa;padding:0;line-height:1;">✕</button>
      </div>

      <!-- พิกัดจังหวัด -->
      ${buildCoordsStrip(province)}
      
      <!-- แหล่งข้อมูล -->
      ${sourceStats ? `<div style="padding:0 20px 8px;">${sourceStats}</div>` : ''}

      <!-- รายการธรรมนูญ -->
      <div style="padding:4px 20px 16px;overflow-y:auto;flex:1;">
        <div style="font-size:10px;color:#aaa;font-weight:500;letter-spacing:0.04em;margin-bottom:8px;">รายการธรรมนูญ</div>
        ${count > 0 ? rowsHtml : '<div style="text-align:center;padding:32px;color:#aaa;">ไม่พบข้อมูลธรรมนูญ</div>'}
      </div>

      <!-- Footer -->
      <div style="padding:12px 20px;border-top:0.5px solid rgba(0,0,0,0.08);display:flex;justify-content:flex-end;flex-shrink:0;">
        <button onclick="closeModal()" style="padding:7px 20px;border:0.5px solid rgba(0,0,0,0.2);border-radius:6px;background:white;color:#444;font-size:13px;cursor:pointer;">ปิด</button>
      </div>
    </div>
  `;

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('charter-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── INIT LEAFLET MAP ──────────────────────────────────────────

function initMap() {
  const container = document.getElementById('leaflet-map');
  if (!container || mapInstance) return;

  mapInstance = L.map('leaflet-map', {
    center: [18.2, 99.5],
    zoom: 7,
    zoomControl: true,
    scrollWheelZoom: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(mapInstance);

  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div');
    div.style.cssText = `
      background:white;padding:8px 10px;border-radius:6px;
      font-size:11px;color:#444;line-height:2;
      border:0.5px solid rgba(0,0,0,0.1);box-shadow:0 1px 4px rgba(0,0,0,0.1);
    `;
    div.innerHTML = `
      <div style="font-weight:500;font-size:12px;margin-bottom:2px;">สัญลักษณ์</div>
      <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1D9E75;margin-right:6px;vertical-align:middle;"></span>มีธรรมนูญในจังหวัด</div>
    `;
    return div;
  };
  legend.addTo(mapInstance);
}

// ── LOAD MARKERS (จาก 3 ตาราง) ─────────────────────────────────

async function loadMapMarkers() {
  if (!mapInstance) return;

  try {
    // ดึงข้อมูลจากทั้ง 3 ตารางพร้อมกัน
    const [northRes, kampaengRes, chainatRes] = await Promise.all([
      db.from('data_north')
        .select('id, charter_name, title, province, district, subdistrict, publish_date, leader, academic_supporter'),
      db.from('data_kampaengphet')
        .select('id, charter_name, title, province, district, subdistrict, publish_date, leader, academic_supporter'),
      db.from('data_chainat')
        .select('id, charter_name, title, province, district, subdistrict, publish_date, leader, academic_supporter')
    ]);

    // ตรวจสอบข้อผิดพลาด
    if (northRes.error) throw northRes.error;
    if (kampaengRes.error) throw kampaengRes.error;
    if (chainatRes.error) throw chainatRes.error;

    // รวมข้อมูลจากทั้ง 3 ตาราง + เพิ่มฟิลด์แหล่งที่มา
    const allData = [
      ...(northRes.data || []).map(r => ({ ...r, _source: 'data_north' })),
      ...(kampaengRes.data || []).map(r => ({ ...r, _source: 'data_kampaengphet' })),
      ...(chainatRes.data || []).map(r => ({ ...r, _source: 'data_chainat' }))
    ];

    if (!allData.length) {
      console.warn('ไม่พบข้อมูลในทั้ง 3 ตาราง');
      return;
    }

    allCharterData = allData;

    // จัดกลุ่มข้อมูลตามจังหวัด
    const byProvince = {};
    allData.forEach(row => {
      const prov = (row.province || 'ไม่ระบุ').trim();
      if (!byProvince[prov]) byProvince[prov] = [];
      byProvince[prov].push(row);
    });

    // สร้าง Marker สำหรับแต่ละจังหวัด
    Object.entries(byProvince).forEach(([province, rows]) => {
      const coords = PROVINCE_COORDS[province];
      if (!coords) {
        console.warn(`ไม่พบพิกัดจังหวัด: "${province}"`);
        return;
      }

      const count = rows.length;
      const [lat, lng] = coords;

      // สร้าง Icon แสดงจำนวนธรรมนูญ
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;
          background:#1D9E75;
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
          cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:11px;font-weight:500;
        ">${count}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker(coords, { icon }).addTo(mapInstance);

      // Tooltip เมื่อโฮเวอร์
      marker.bindTooltip(
        `<b>จ.${province}</b> — ${count} ธรรมนูญ<br>
         <span style="font-size:10px;color:#888;font-family:monospace;">
           ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E
         </span>`,
        { direction: 'top', offset: [0, -20], opacity: 0.95 }
      );

      // คลิกเพื่อเปิด Modal
      marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        openModal(province, rows);
      });
    });

    console.log(`✓ วาง markers: ${Object.keys(byProvince).length} จังหวัด, ${allData.length} ธรรมนูญ`);

  } catch (err) {
    console.error('loadMapMarkers:', err.message);
  }
}

// ── KPI OVERVIEW (จาก 3 ตาราง) ─────────────────────────────────

async function loadOverviewKPIs() {
  try {
    // ดึงข้อมูลจังหวัดจากทั้ง 3 ตาราง
    const [northProv, kampaengProv, chainatProv] = await Promise.all([
      db.from('data_north').select('province'),
      db.from('data_kampaengphet').select('province'),
      db.from('data_chainat').select('province')
    ]);

    // รวมจังหวัดทั้งหมด
    const allProvinces = [
      ...(northProv.data || []),
      ...(kampaengProv.data || []),
      ...(chainatProv.data || [])
    ].map(r => r.province);

    // นับจังหวัดที่ไม่ซ้ำ
    const uniqueCount = new Set(allProvinces.filter(p => p)).size;
    
    // อัปเดต UI
    setEl('kpi-provinces', uniqueCount);
    
    // แสดงเป็นค่าประมาณ (เนื่องจากยังไม่มี column has_article12)
    setEl('kpi-article12-pct', '-');
    setEl('kpi-livingwill-total', '-');
    
    console.log(`✓ KPI: พบ ${uniqueCount} จังหวัดที่มีธรรมนูญ`);
    
  } catch (err) {
    console.error('loadOverviewKPIs:', err.message);
    setEl('kpi-provinces', 'Error');
  }
}
// ── CHARTER TABLE (จาก 3 ตาราง) ────────────────────────────────

async function loadCharterTable({ province = null, year = null } = {}) {
  const tbody = document.getElementById('charter-tbody');
  if (!tbody) return;
  showLoading('charter-tbody', 7);

  try {
    // ดึงจากทั้ง 3 ตาราง
    const [northRes, kampaengRes, chainatRes] = await Promise.all([
      db.from('data_north').select('id, charter_name, title, province, district, subdistrict, publish_date, leader'),
      db.from('data_kampaengphet').select('id, charter_name, title, province, district, subdistrict, publish_date, leader'),
      db.from('data_chainat').select('id, charter_name, title, province, district, subdistrict, publish_date, leader')
    ]);

    if (northRes.error) throw northRes.error;
    if (kampaengRes.error) throw kampaengRes.error;
    if (chainatRes.error) throw chainatRes.error;

    // รวมและเพิ่มแหล่งที่มา
    let allData = [
      ...(northRes.data || []).map(r => ({ ...r, _source: 'data_north' })),
      ...(kampaengRes.data || []).map(r => ({ ...r, _source: 'data_kampaengphet' })),
      ...(chainatRes.data || []).map(r => ({ ...r, _source: 'data_chainat' }))
    ];

    // กรองตามฟิลเตอร์
    if (province && province !== 'all') {
      allData = allData.filter(r => r.province === province);
    }
    if (year && year !== 'all') {
      allData = allData.filter(r => {
        if (!r.publish_date) return false;
        const rowYear = new Date(r.publish_date).getFullYear() + 543;
        return rowYear === parseInt(year);
      });
    }

    // เรียงลำดับและตัดจำนวน
    allData.sort((a, b) => new Date(b.publish_date || 0) - new Date(a.publish_date || 0));
    const displayData = allData.slice(0, 50);

    if (!displayData.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#aaa;">ไม่พบข้อมูล</td></tr>`;
      return;
    }

    // สร้างตาราง
    tbody.innerHTML = displayData.map(row => {
      const sourceBadge = row._source === 'data_kampaengphet' 
        ? '<span style="background:#E6F1FB;color:#378ADD;font-size:10px;padding:2px 6px;border-radius:4px;">กพ.</span>'
        : row._source === 'data_chainat'
          ? '<span style="background:#FFF4E6;color:#EF9F27;font-size:10px;padding:2px 6px;border-radius:4px;">ชน.</span>'
          : '';
      
      return `
      <tr style="cursor:pointer;" onclick="openCharterModal('${row.id}')">
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            ${row.charter_name || row.title || '—'}
            ${sourceBadge}
          </div>
        </td>
        <td>${row.province || '—'}</td>
        <td>${row.publish_date ? new Date(row.publish_date).getFullYear() + 543 : '—'}</td>
        <td style="color:#aaa;font-size:11px;">—</td>
        <td style="color:#aaa;font-size:11px;">—</td>
        <td>${row.district || '—'}${row.subdistrict ? ' · ' + row.subdistrict : ''}</td>
        <td><span class="open-btn">เปิดดู</span></td>
      </tr>
    `;
    }).join('');

    setEl('charter-count', `แสดง ${displayData.length} จาก ${allData.length} รายการ`);

  } catch (err) {
    showError('charter-tbody', 'โหลดข้อมูลไม่สำเร็จ: ' + err.message, 7);
  }
}

function openCharterModal(id) {
  const row = allCharterData.find(r => String(r.id) === String(id));
  if (!row) return;
  openModal(row.province || 'ไม่ระบุ', [row]);
}

// ── LIVING WILL (ยังไม่มี table) ─────────────────────────────

async function loadLivingWillStats() {
  setEl('lw-total', 'N/A');
  setEl('lw-this-month', 'N/A');
  setEl('lw-pct-online', 'N/A');
  const el = document.getElementById('lw-province-bars');
  if (el) el.innerHTML = '<div style="color:#aaa;font-size:12px;padding:10px 0;">ยังไม่มีข้อมูล Living Will</div>';
}

// ── GAP ANALYSIS (ยังไม่มี column ที่ต้องการ) ────────────────

async function loadGapAnalysis() {
  const tbody = document.getElementById('gap-tbody');
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align:center;padding:24px;color:#aaa;line-height:2;">
        ยังไม่มีข้อมูล Gap Analysis<br>
        <span style="font-size:11px;">ต้องเพิ่ม column <code>has_article12</code> และ <code>living_will_count</code> ใน Supabase</span>
      </td>
    </tr>`;
}

// ── CHARTER FILTER ────────────────────────────────────────────

function bindCharterFilters() {
  const btn = document.getElementById('charter-search-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const province = document.getElementById('filter-province')?.value;
    const year     = document.getElementById('filter-year')?.value;
    loadCharterTable({
      province: province === 'all' ? null : province,
      year:     year     === 'all' ? null : year,
    });
  });
}

// ── INIT ──────────────────────────────────────────────────────

async function initDashboard() {
  initMap();
  await Promise.all([
    loadMapMarkers(),
    loadOverviewKPIs(),
    loadCharterTable(),
    loadLivingWillStats(),
    loadGapAnalysis(),
  ]);
  bindCharterFilters();
}

document.addEventListener('DOMContentLoaded', initDashboard);

// ── AUTH / LOGIN SYSTEM ──────────────────────────────────────

/**
 * เปิดโมดัลล็อกอิน
 */
function openLoginModal() {
  // สร้างโมดัลถ้ายังไม่มี
  let modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('active');
    return;
  }
  
  modal = document.createElement('div');
  modal.id = 'login-modal';
  modal.className = 'login-modal-overlay';
  modal.innerHTML = `
    <div class="login-modal">
      <div class="login-modal-header">
        <div class="login-modal-title">เข้าสู่ระบบ</div>
        <button class="login-modal-close" onclick="closeLoginModal()">&times;</button>
      </div>
      <div class="login-modal-body">
        <form class="login-form" id="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label for="login-email">อีเมล</label>
            <input type="email" id="login-email" placeholder="admin@example.com" required>
          </div>
          <div class="form-group">
            <label for="login-password">รหัสผ่าน</label>
            <input type="password" id="login-password" placeholder="••••••••" required>
          </div>
          <div class="login-error" id="login-error">
            อีเมลหรือรหัสผ่านไม่ถูกต้อง
          </div>
          <button type="submit" class="login-btn-primary" id="login-submit">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
      <div class="login-modal-footer">
        <a href="#" onclick="alert('ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์เข้าถึง'); return false;">
          ลืมรหัสผ่าน?
        </a>
      </div>
    </div>
  `;
  
  // ปิดโมดัลเมื่อคลิกนอกเนื้อหา
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLoginModal();
  });
  
  // ปิดด้วยปุ่ม Escape
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeLoginModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
  
  document.body.appendChild(modal);
  modal.classList.add('active');
  
  // โฟกัสที่ช่องอีเมล
  setTimeout(() => {
    document.getElementById('login-email')?.focus();
  }, 100);
}

/**
 * ปิดโมดัลล็อกอิน
 */
function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal?.remove(), 200);
  }
  // ล้างฟอร์ม
  const form = document.getElementById('login-form');
  if (form) form.reset();
  hideLoginError();
}

/**
 * แสดงข้อผิดพลาดล็อกอิน
 */
function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (el) {
    el.textContent = msg || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    el.classList.add('show');
  }
}

function hideLoginError() {
  const el = document.getElementById('login-error');
  if (el) el.classList.remove('show');
}

/**
 * จัดการล็อกอิน (จำลอง)
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email')?.value;
  const password = document.getElementById('login-password')?.value;
  const submitBtn = document.getElementById('login-submit');
  
  if (!email || !password) {
    showLoginError('กรุณากรอกอีเมลและรหัสผ่าน');
    return;
  }
  
  // แสดงสถานะกำลังโหลด
  submitBtn.disabled = true;
  submitBtn.textContent = 'กำลังเข้าสู่ระบบ...';
  hideLoginError();
  
  try {
    // 🔐 จำลองการตรวจสอบ (แทนที่ด้วย Supabase Auth จริง)
    // สำหรับ Demo: ยอมรับอีเมลใดๆ ที่ลงท้ายด้วย @example.com
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (email.endsWith('@example.com') && password.length >= 6) {
      // ล็อกอินสำเร็จ
      const user = {
        name: email.split('@')[0],
        email: email,
        role: 'admin'
      };
      
      // บันทึกสถานะใน localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // อัปเดต UI
      updateAuthUI(user);
      
      // ปิดโมดัล
      closeLoginModal();
      
      // แสดงข้อความต้อนรับ
      alert(`ยินดีต้อนรับ, ${user.name}! 👋`);
      
    } else {
      // ล็อกอินไม่สำเร็จ
      showLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    
  } catch (err) {
    console.error('Login error:', err);
    showLoginError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    
  } finally {
    // คืนค่าปุ่ม
    submitBtn.disabled = false;
    submitBtn.textContent = 'เข้าสู่ระบบ';
  }
}

/**
 * ออกจากระบบ
 */
function logout() {
  if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
    // ลบข้อมูลผู้ใช้
    localStorage.removeItem('user');
    
    // อัปเดต UI
    updateAuthUI(null);
    
    console.log('🔓 Logged out');
  }
}

/**
 * อัปเดตสถานะ Auth ใน UI
 */
function updateAuthUI(user) {
  const loginView = document.getElementById('login-view');
  const userView = document.getElementById('user-view');
  
  if (user) {
    // แสดงข้อมูลผู้ใช้
    loginView.style.display = 'none';
    userView.style.display = 'flex';
    
    document.getElementById('user-name').textContent = user.name || 'ผู้ดูแลระบบ';
    document.getElementById('user-role').textContent = user.role || 'User';
    document.getElementById('user-avatar').textContent = 
      (user.name?.[0] || '👤').toUpperCase();
      
  } else {
    // แสดงปุ่มล็อกอิน
    loginView.style.display = 'block';
    userView.style.display = 'none';
  }
}

/**
 * ตรวจสอบสถานะล็อกอินเมื่อโหลดหน้า
 */
function checkAuthStatus() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      updateAuthUI(user);
      console.log('✅ User logged in:', user.name);
    }
  } catch (err) {
    console.error('Auth check error:', err);
    localStorage.removeItem('user');
    updateAuthUI(null);
  }
}

// ── INIT: ตรวจสอบสถานะล็อกอิน ─────────────────────────────

// เพิ่มในฟังก์ชัน initDashboard() หรือเรียกแยก:
document.addEventListener('DOMContentLoaded', () => {
  // ... โค้ดเดิม ...
  
  // ✅ ตรวจสอบสถานะล็อกอิน
  checkAuthStatus();
});

// ── EXPORT สำหรับใช้งานภายนอก ──────────────────────────────

window.auth = {
  openLoginModal,
  closeLoginModal,
  logout,
  checkAuthStatus,
  updateAuthUI
};