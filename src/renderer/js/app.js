/**
 * ProTech ERP - Main Application Router, Modal System & LKR Currency Utilities
 */

// Global LKR Currency Formatter
window.formatLKR = function(amount) {
  const numeric = Number(amount) || 0;
  return `LKR ${numeric.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Modal Controls
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    // Auto-focus the first focusable input inside the modal so typing works immediately
    setTimeout(() => {
      const firstInput = modal.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 50);
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    // Return focus to body so nothing is left in a trapped state
    document.body.focus();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initGlobalSearch();
  initModalTriggers();
  console.log('[ProTech] App Router & Modal Controllers Initialized');
});

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      if (!targetView) return;

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      viewSections.forEach(section => {
        if (section.id === `view-${targetView}`) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    });
  });
}

function initGlobalSearch() {
  const searchInput = document.getElementById('global-plate-search');
  if (!searchInput) return;

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim().toUpperCase();
      if (query && window.GarageFlowJobCards) {
        window.GarageFlowJobCards.searchByPlate(query);
      }
    }
  });
}

function initModalTriggers() {
  const createBtns = document.querySelectorAll('.btn-open-create-jobcard');
  createBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('modal-new-jobcard');
    });
  });

  // Close modals when clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
}
