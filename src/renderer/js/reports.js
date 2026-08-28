/**
 * ProTech ERP - Reports & Profit Export Controller
 */

window.GarageFlowReports = {
  exportCSV: function() {
    const jobCards = window.GarageFlowJobCards ? window.GarageFlowJobCards.activeJobCards : [];
    if (!jobCards || jobCards.length === 0) {
      alert('No job card data available to export.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Job ID,Vehicle Plate,Customer,Status,Parts Cost LKR,Parts Sell LKR,Labor Total LKR,Grand Total LKR\n";

    jobCards.forEach(j => {
      const partsCost = (j.parts || []).reduce((sum, p) => sum + ((p.cost_price || 0) * (p.qty || 1)), 0);
      const partsSell = (j.parts || []).reduce((sum, p) => sum + ((p.sell_price || 0) * (p.qty || 1)), 0);
      const laborTotal = (j.labor || []).reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
      const grandTotal = partsSell + laborTotal;

      csvContent += `"${j.job_card_id || j.id}","${j.vehicle_plate}","${j.customer_name}","${j.status || 'Received'}",${partsCost},${partsSell},${laborTotal},${grandTotal}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ProTech_Garage_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('btn-export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.GarageFlowReports.exportCSV();
    });
  }
});
