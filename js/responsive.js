/* =====================================================
   RESPONSIVE JS v2 — Data Area North
   วางต่อท้าย script.js หรือสร้างไฟล์ใหม่ responsive.js
   ===================================================== */

(function () {
  'use strict';

  /* ── เมนูและสี (ต้องตรงกับ sidebar เดิม) ── */
  const NAV_ITEMS = [
    { id: 'overview',   label: 'ภาพรวม',     color: '#1D9E75' },
    { id: 'charter',    label: 'ธรรมนูญ',     color: '#378ADD' },
    { id: 'livingwill', label: 'Living Will', color: '#D4537E' },
    { id: 'gap',        label: 'Gap Analysis', color: '#EF9F27' },
  ];

  /* ── สร้าง Top Nav Bar ── */
  function createTopBar() {
    const bar = document.createElement('div');
    bar.className = 'mobile-topbar';
    bar.id = 'mobile-topbar';

    /* Logo */
    const logo = document.createElement('div');
    logo.className = 'mobile-topbar-logo';
    logo.textContent = 'Data Area North';
    bar.appendChild(logo);

    /* Nav items */
    NAV_ITEMS.forEach(item => {
      const el = document.createElement('div');
      el.className = 'mobile-nav-item' + (item.id === 'overview' ? ' active' : '');
      el.dataset.page = item.id;
      el.innerHTML = `<span class="mobile-nav-dot" style="background:${item.color};"></span>${item.label}`;
      el.addEventListener('click', () => {
        /* เรียก showPage เดิม */
        if (typeof showPage === 'function') {
          /* หา nav-item ใน sidebar เพื่อ sync active state */
          const sidebarNav = document.querySelector(`.nav-item[onclick*="'${item.id}'"]`);
          showPage(item.id, sidebarNav);
        }
        /* อัปเดต active ใน topbar */
        bar.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        /* scroll ให้ item ที่เลือกอยู่กลาง */
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      bar.appendChild(el);
    });

    /* User avatar (ขวาสุด) */
    const userWrap = document.createElement('div');
    userWrap.className = 'mobile-topbar-user';
    userWrap.id = 'mobile-topbar-user';
    userWrap.innerHTML = `<div class="mobile-user-avatar" id="mobile-avatar" onclick="window.location.href='login.html'">👤</div>`;
    bar.appendChild(userWrap);

    document.body.appendChild(bar);
  }

  /* ── sync avatar กับ localStorage ── */
  function syncAvatar() {
    const avatarEl = document.getElementById('mobile-avatar');
    if (!avatarEl) return;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const loginTime = new Date(user.loginTime);
        const hoursDiff = (new Date() - loginTime) / 3600000;
        if (hoursDiff < 24 && user.loggedIn) {
          const initial = (user.name || user.username || 'U').charAt(0).toUpperCase();
          avatarEl.textContent = initial;
          avatarEl.style.background = user.role === 'admin'
            ? 'linear-gradient(135deg,#EF9F27,#B5721C)'
            : 'linear-gradient(135deg,#1D9E75,#0F6E56)';
          /* คลิก avatar → logout */
          avatarEl.onclick = () => {
            if (typeof handleLogout === 'function') handleLogout();
          };
          return;
        }
      }
      /* ยังไม่ล็อกอิน */
      avatarEl.textContent = '👤';
      avatarEl.onclick = () => window.location.href = 'login.html';
    } catch (e) { /* ignore */ }
  }

  /* ── sync active page กับ topbar (เผื่อมีการเรียก showPage จากที่อื่น) ── */
  function patchShowPage() {
    const original = window.showPage;
    if (typeof original !== 'function') return;
    window.showPage = function (pageId, navEl) {
      original(pageId, navEl);
      /* อัปเดต active ใน topbar */
      const bar = document.getElementById('mobile-topbar');
      if (bar) {
        bar.querySelectorAll('.mobile-nav-item').forEach(n => {
          n.classList.toggle('active', n.dataset.page === pageId);
        });
      }
    };
  }

  /* ── ห่อ table ด้วย scroll wrapper ── */
  function wrapTables() {
    document.querySelectorAll('.card table').forEach(table => {
      if (table.parentElement.classList.contains('table-scroll-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll-wrap';
      wrap.style.cssText = 'overflow-x:auto;-webkit-overflow-scrolling:touch;';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* ── ปิด map modal ด้วย Escape ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && typeof closeMapModal === 'function') closeMapModal();
  });

  /* ── sync เมื่อ storage เปลี่ยน (login/logout จากแท็บอื่น) ── */
  window.addEventListener('storage', e => {
    if (e.key === 'user') syncAvatar();
  });

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    createTopBar();
    syncAvatar();
    patchShowPage();
    wrapTables();
  });

})();