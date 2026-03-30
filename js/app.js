// js/app.js

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

// Main Initialization
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    fetchData();
    setLastUpdatedDate();
});

// Set Date
function setLastUpdatedDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('last-updated').innerText = now.toLocaleDateString('th-TH', options);
}

// Fetch Data Function
async function fetchData() {
    try {
        // --- ส่วนนี้สำหรับใช้กับ Supabase จริง ---
        // const { data: charters, error } = await supabase.from('charters').select('*');
        
        // --- ส่วนนี้สำหรับใช้ Mock Data (ทดสอบ) ---
        // จำลองความล่าช้าในการโหลด
        await new Promise(r => setTimeout(r, 800)); 
        const charters = MOCK_CHARTERS; 

        if (charters) {
            renderKPIs(charters);
            renderTable(charters);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('charter-table-body').innerHTML = `
            <tr>
                <td colspan="6" class="p-4 text-red-500 text-center">
                    <i class="fa-solid fa-circle-exclamation mr-2"></i>เกิดข้อผิดพลาดในการดึงข้อมูล
                </td>
            </tr>`;
    }
}

// Render KPI Cards
function renderKPIs(data) {
    const total = data.length;
    const withM12 = data.filter(c => c.has_m12).length;
    const percent = total > 0 ? Math.round((withM12 / total) * 100) : 0;

    // Animate Numbers (Simple)
    document.getElementById('kpi-charter-count').innerText = total + " ฉบับ";
    document.getElementById('kpi-m12-percent').innerText = percent + "%";
    document.getElementById('progress-m12').style.width = percent + "%";
    
    // Hardcoded for demo
    document.getElementById('kpi-living-will').innerText = "24,560"; 
    document.getElementById('kpi-units').innerText = "320"; 
}

// Render Table
function renderTable(data) {
    const tbody = document.getElementById('charter-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">ไม่พบข้อมูล</td></tr>';
        return;
    }

    data.forEach(item => {
        const statusBadge = getStatusBadge(item.status);
        const m12Icon = item.has_m12 
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fa-solid fa-check mr-1"></i> มี</span>' 
            : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">ไม่มี</span>';

        const row = `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4 font-medium text-slate-900">${item.name}</td>
                <td class="p-4 text-slate-600">${item.district}, ${item.province}</td>
                <td class="p-4 text-slate-600">${item.year}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-center">${m12Icon}</td>
                <td class="p-4 text-right">
                    <button class="text-teal-600 hover:text-teal-800 font-medium text-sm">ดูรายละเอียด</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Helper: Status Badge
function getStatusBadge(status) {
    switch(status) {
        case 'active': return '<span class="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">ใช้จริง</span>';
        case 'draft': return '<span class="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-700">ร่าง</span>';
        case 'update': return '<span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">ปรับปรุง</span>';
        default: return '<span class="px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-600">-</span>';
    }
}

// Initialize Chart.js
function initCharts() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2563', '2564', '2565', '2566', '2567'],
            datasets: [{
                label: 'จำนวนผู้ทำ Living Will',
                data: [5000, 8500, 12000, 18000, 24560],
                borderColor: '#0d9488', // Teal-600
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}