/**
 * ProTech ERP - Dashboard Metric Controller
 */

window.GarageFlowDashboard = {
  updateStats: function(jobCards) {
    if (!Array.isArray(jobCards)) return;

    const activeJobs = jobCards.filter(j => j.status !== 'Delivered');
    const activeCount = activeJobs.length;

    const diagnosingCount = jobCards.filter(j => j.status === 'Diagnosing').length;
    const inRepairCount = jobCards.filter(j => j.status === 'In Repair').length;

    let todayRevenue = 0;
    let partsProfit = 0;
    let pendingReceivables = 0;
    let pendingCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    jobCards.forEach(jc => {
      // Parts Profit Calculation
      const parts = jc.parts || [];
      parts.forEach(p => {
        const lineProfit = ((p.sell_price || 0) - (p.cost_price || 0)) * (p.qty || 1);
        partsProfit += lineProfit;
      });

      // Total Line Items calculation
      const partsTotal = parts.reduce((sum, p) => sum + ((p.sell_price || 0) * (p.qty || 1)), 0);
      const laborTotal = (jc.labor || []).reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
      const grandTotal = partsTotal + laborTotal;

      if (jc.status === 'Delivered') {
        const jcDate = jc.intake_date || (jc.created_at && jc.created_at.toDate ? jc.created_at.toDate().toISOString().split('T')[0] : '');
        if (jcDate === todayStr) {
          todayRevenue += grandTotal;
        }
      } else if (jc.status === 'Ready') {
        pendingReceivables += grandTotal;
        pendingCount++;
      }
    });

    // Update Dashboard DOM Elements
    const activeEl = document.getElementById('stat-active-jobs');
    if (activeEl) activeEl.textContent = activeCount;

    const breakdownEl = document.getElementById('stat-active-breakdown');
    if (breakdownEl) breakdownEl.textContent = `${diagnosingCount} Diagnosing • ${inRepairCount} In Repair`;

    const revenueEl = document.getElementById('stat-today-revenue');
    if (revenueEl) revenueEl.textContent = window.formatLKR(todayRevenue);

    const profitEl = document.getElementById('stat-parts-profit');
    if (profitEl) profitEl.textContent = window.formatLKR(partsProfit);

    const receivablesEl = document.getElementById('stat-receivables');
    if (receivablesEl) receivablesEl.textContent = window.formatLKR(pendingReceivables);

    const receivablesCountEl = document.getElementById('stat-receivables-count');
    if (receivablesCountEl) receivablesCountEl.textContent = `${pendingCount} Unpaid ready invoices`;

    // Also update Reports view cards if available
    const reportLaborEl = document.getElementById('report-labor-revenue');
    if (reportLaborEl) {
      let totalLabor = 0;
      jobCards.forEach(j => {
        (j.labor || []).forEach(l => {
          totalLabor += (l.hours || 0) * (l.rate || 0);
        });
      });
      reportLaborEl.textContent = window.formatLKR(totalLabor);
    }

    const reportProfitEl = document.getElementById('report-parts-profit');
    if (reportProfitEl) reportProfitEl.textContent = window.formatLKR(partsProfit);
  }
};
