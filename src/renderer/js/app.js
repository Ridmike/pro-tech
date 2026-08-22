/**
 * GarageFlow ERP - Main Application Router & Event Dispatcher
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initGlobalSearch();
  console.log('[GarageFlow] App Router Initialized');
});

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      if (!targetView) return;

      // Update Nav active class
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Switch View Section
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
      if (query) {
        alert(`Searching vehicle records for license plate: ${query}`);
        // Redirect to Vehicles or Job Card search
      }
    }
  });
}
