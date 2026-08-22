/**
 * GarageFlow ERP - Dashboard View Controller
 */

window.GarageFlowDashboard = {
  renderMetrics: function() {
    console.log('[Dashboard] Rendering live metric indicators');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.GarageFlowDashboard) {
    window.GarageFlowDashboard.renderMetrics();
  }
});
