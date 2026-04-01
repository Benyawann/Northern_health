/* ========================================
   Northern Health Data Platform
   Custom JavaScript
   ======================================== */

/**
 * Switch between different page views
 * @param {string} pageId - The ID of the page to show (without 'page-' prefix)
 * @param {HTMLElement} navElement - The navigation item that was clicked
 */
function showPage(pageId, navElement) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (navElement) {
        navElement.classList.add('active');
    }
    
    // Log page view for analytics (optional)
    console.log('Page viewed:', pageId);
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Northern Health Data Platform initialized');
    
    // Add click handler for "Open" buttons in charter table
    const openButtons = document.querySelectorAll('.open-btn');
    openButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('tr');
            const charterName = row.querySelector('td:first-child').textContent;
            alert('เปิดดูรายละเอียด: ' + charterName);
        });
    });
    
    // Add click handler for download button in public page
    const downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            alert('กำลังดาวน์โหลดแบบฟอร์ม Living Will...\n(ในเวอร์ชันจริงจะดาวน์โหลดไฟล์ PDF)');
        });
    }
    
    // Add hover effect for map dots (overview page)
    const mapCircles = document.querySelectorAll('.map-placeholder circle');
    mapCircles.forEach(circle => {
        circle.style.cursor = 'pointer';
        circle.addEventListener('mouseenter', function() {
            this.setAttribute('r', parseInt(this.getAttribute('r')) + 2);
        });
        circle.addEventListener('mouseleave', function() {
            this.setAttribute('r', parseInt(this.getAttribute('r')) - 2);
        });
        circle.addEventListener('click', function() {
            const opacity = this.getAttribute('opacity');
            const fill = this.getAttribute('fill');
            let status = 'ไม่ทราบสถานะ';
            
            if (fill === '#1D9E75') status = 'มีธรรมนูญ + ม.12';
            else if (fill === '#EF9F27') status = 'มีธรรมนูญอย่างเดียว';
            else if (fill === '#E24B4A') status = 'ยังไม่มีข้อมูล';
            
            alert('พื้นที่นี้: ' + status + '\nระดับการครอบคลุม: ' + (parseFloat(opacity) * 100).toFixed(0) + '%');
        });
    });
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(event) {
        // Ctrl + Number keys to switch pages
        if (event.ctrlKey) {
            const keyMap = {
                '1': 'overview',
                '2': 'charter',
                '3': 'livingwill',
                '4': 'gap',
                '5': 'public'
            };
            
            if (keyMap[event.key]) {
                event.preventDefault();
                const pageId = keyMap[event.key];
                const navItem = document.querySelector(`.nav-item[onclick*="'${pageId}'"]`);
                if (navItem) {
                    showPage(pageId, navItem);
                }
            }
        }
    });
    
    // Add search functionality placeholder
    const searchButton = document.querySelector('.search-bar button');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const selects = document.querySelectorAll('.search-bar select');
            const filters = Array.from(selects).map(s => s.value);
            console.log('Search filters:', filters);
            alert('ค้นหาด้วยเงื่อนไข:\n' + filters.join('\n'));
        });
    }
    
    // Animate KPI values on page load (simple counter effect)
    animateKPIs();
});

/**
 * Simple animation for KPI numbers on page load
 */
function animateKPIs() {
    const kpiValues = document.querySelectorAll('.kpi-value');
    
    kpiValues.forEach(el => {
        const finalValue = el.textContent;
        const isNumber = !isNaN(finalValue.replace(/,/g, '').replace('%', ''));
        
        if (isNumber && !el.dataset.animated) {
            el.dataset.animated = 'true';
            // Simple fade-in effect
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 100);
        }
    });
}

/**
 * Utility: Format number with Thai locale
 * @param {number} num - Number to format
 * @returns {string} Formatted string
 */
function formatThaiNumber(num) {
    return num.toLocaleString('th-TH');
}

/**
 * Utility: Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
function calculatePercentage(part, total) {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
}

/**
 * Export functions for external use
 */
window.NorthernHealthPlatform = {
    showPage,
    formatThaiNumber,
    calculatePercentage
};