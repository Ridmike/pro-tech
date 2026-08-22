/**
 * GarageFlow ERP - Job Cards Controller & Workflow Lifecycle Manager
 */

window.GarageFlowJobCards = {
  statuses: ['Received', 'Diagnosing', 'In Repair', 'Ready', 'Delivered'],

  createJobCard: function(vehiclePlate, problemDescription, mechanic) {
    console.log(`[JobCard] Creating active job card for vehicle: ${vehiclePlate}`);
  },

  updateStatus: function(jobId, newStatus) {
    console.log(`[JobCard] Updating Job ID ${jobId} status to: ${newStatus}`);
  }
};
