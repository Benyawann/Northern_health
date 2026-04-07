/* =====================================================
   responsive.js — Data Area North
   วางก่อนปิด </body> ใน index.html
   ===================================================== */

(function () {
  'use strict';

  /* ── เมนู (ตรงกับ sidebar) ── */
  const NAV_ITEMS = [
    { id: 'overview',   label: 'ภาพรวม',      color: '#1D9E75' },
    { id: 'charter',    label: 'ธรรมนูญ',      color: '#378ADD' },
    { id: 'livingwill', label: 'Living Will',  color: '#D4537E' },
    { id: 'gap',        label: 'Gap Analysis', color: '#EF9F27' },
  ];

  /* ════════════════════════════════════════════════
     TOP NAV BAR
     ════════════════════════════════════════════════ */
  function createTopBar() {
    if (document.getElementById('mobile-topbar')) return;

    const bar = document.createElement('div');
    bar.className = 'mobile-topbar';
    bar.id = 'mobile-topbar';

    /* Logo */
    const logo = document.createElement('div');
    logo.className = 'mobile-topbar-logo';
    logo.textContent = 'Data Area North';
    bar.appendChild(logo);

    /* Nav items */
    const currentPage = getCurrentPage();

    NAV_ITEMS.forEach(item => {
      const el = document.createElement('div');
      el.className = 'mobile-nav-item' + (item.id === currentPage ? ' active' : '');
      el.dataset.page = item.id;
      el.innerHTML =
        `<span class="mobile-nav-dot" style="background:${item.color};"></span>${item.label}`;

      el.addEventListener('click', () => {
        /* เรียก showPage เดิม */
        if (typeof window.showPage === 'function') {
          const sidebarNav = document.querySelector(`.nav-item[onclick*="'${item.id}'"]`);
          window.showPage(item.id, sidebarNav);
        }
        /* active highlight */
        bar.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        /* scroll to center */
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        /* scroll main back to top */
        const main = document.querySelector('.main');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
      });

      bar.appendChild(el);
    });

    /* User avatar */
    const userWrap = document.createElement('div');
    userWrap.className = 'mobile-topbar-user';
    userWrap.id = 'mobile-topbar-user';

    const avatar = document.createElement('div');
    avatar.className = 'mobile-user-avatar';
    avatar.id = 'mobile-avatar';
    avatar.textContent = '👤';
    avatar.onclick = () => window.location.href = 'login.html';

    userWrap.appendChild(avatar);
    bar.appendChild(userWrap);

    document.body.appendChild(bar);
  }

  /* ── ตรวจหน้าที่ active อยู่ ── */
  function getCurrentPage() {
    const active = document.querySelector('.page.active');
    if (!active) return 'overview';
    return active.id.replace('page-', '') || 'overview';
  }

  /* ════════════════════════════════════════════════
     PATCH showPage — sync topbar active state
     ════════════════════════════════════════════════ */
  function patchShowPage() {
    const original = window.showPage;
    if (typeof original !== 'function') return;

    window.showPage = function (pageId, navEl) {
      original.call(this, pageId, navEl);

      const bar = document.getElementById('mobile-topbar');
      if (bar) {
        bar.querySelectorAll('.mobile-nav-item').forEach(n => {
          n.classList.toggle('active', n.dataset.page === pageId);
        });
      }
    };
  }

  /* ════════════════════════════════════════════════
     AVATAR SYNC
     ════════════════════════════════════════════════ */
  function syncAvatar() {
    const avatarEl = document.getElementById('mobile-avatar');
    if (!avatarEl) return;

    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const elapsed = (Date.now() - new Date(user.loginTime).getTime()) / 3600000;

        if (elapsed < 24 && user.loggedIn) {
          const initial = (user.name || user.username || 'U').charAt(0).toUpperCase();
          avatarEl.textContent = initial;
          avatarEl.style.background = user.role === 'admin'
            ? 'linear-gradient(135deg,#EF9F27,#B5721C)'
            : 'linear-gradient(135deg,#1D9E75,#0F6E56)';
          avatarEl.onclick = () => {
            if (typeof window.handleLogout === 'function') window.handleLogout();
          };
          return;
        }
      }
    } catch (e) { /* ignore */ }

    avatarEl.textContent = '👤';
    avatarEl.onclick = () => window.location.href = 'login.html';
  }

  /* ════════════════════════════════════════════════
     TABLE SCROLL WRAPPER
     ════════════════════════════════════════════════ */
  function wrapTables() {
    document.querySelectorAll('.card table, [style*="overflow:auto"] table').forEach(table => {
      const parent = table.parentElement;
      /* ข้ามถ้า wrap แล้ว หรืออยู่ใน modal */
      if (parent.classList.contains('table-scroll-wrap')) return;
      if (parent.closest('#map-modal-ov')) return;

      const wrap = document.createElement('div');
      wrap.className = 'table-scroll-wrap';
      parent.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* ════════════════════════════════════════════════
     PAGINATION WRAPPER — จัดกลาง
     ════════════════════════════════════════════════ */
  function wrapPagination() {
    /* charter */
    replacePager('charter-pager', 'charter-count');
    /* livingwill */
    replacePager('lw-pager', 'lw-count');
  }

  function replacePager(pagerId, countId) {
    const pager = document.getElementById(pagerId);
    const count = document.getElementById(countId);
    if (!pager || !count) return;

    /* ถ้า parent เป็น pagination-wrap แล้ว ข้าม */
    if (pager.parentElement?.classList.contains('pagination-wrap')) return;

    /* สร้าง wrapper ใหม่ */
    const wrap = document.createElement('div');
    wrap.className = 'pagination-wrap';

    const countWrap = document.createElement('div');
    countWrap.className = 'pagination-count';

    /* ย้าย pager และ count เข้า wrap */
    const pagerParent = pager.parentElement;
    pagerParent.insertBefore(wrap, pager);

    wrap.appendChild(pager);
    wrap.appendChild(countWrap);

    /* ย้าย count div เข้า countWrap */
    countWrap.appendChild(count);

    /* ลบ parent เดิมถ้าว่างเปล่า (เดิมใช้ justify-content:space-between) */
    if (pagerParent !== wrap && pagerParent.children.length === 0) {
      pagerParent.remove();
    }
  }

  /* ════════════════════════════════════════════════
     VIEWPORT HEIGHT FIX — iOS Safari
     ════════════════════════════════════════════════ */
  function fixViewportHeight() {
    /* ถ้า browser ไม่รองรับ dvh ให้ใช้ JS fallback */
    if (CSS.supports('height', '100dvh')) return;

    function setVh() {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', () => setTimeout(setVh, 200));
  }

  /* ════════════════════════════════════════════════
     KEYBOARD ESC — ปิด modal
     ════════════════════════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (typeof window.closeMapModal === 'function') window.closeMapModal();
    if (typeof window.closeConfirmModal === 'function') window.closeConfirmModal();
  });

  /* ════════════════════════════════════════════════
     STORAGE SYNC — login/logout จากแท็บอื่น
     ════════════════════════════════════════════════ */
  window.addEventListener('storage', e => {
    if (e.key === 'user') syncAvatar();
  });

  /* ════════════════════════════════════════════════
     INIT
     ════════════════════════════════════════════════ */
  function init() {
    fixViewportHeight();
    createTopBar();
    syncAvatar();
    patchShowPage();
    wrapTables();
    wrapPagination();

    /* wrapTables อีกครั้งหลัง data โหลด (script.js มักโหลดข้อมูล async) */
    setTimeout(wrapTables, 1500);
    setTimeout(wrapTables, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();