/**
 * ProTech ERP - Billing & Invoicing Module (LKR)
 */

window.GarageFlowBilling = {
  renderInvoices: function(jobCards) {
    const tbody = document.getElementById('billing-list');
    if (!tbody) return;

    const readyOrDelivered = jobCards.filter(j => j.status === 'Ready' || j.status === 'Delivered');

    if (readyOrDelivered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-dim);">No generated invoices found. Mark a Job Card as Ready to create an invoice!</td></tr>`;
      return;
    }

    tbody.innerHTML = readyOrDelivered.map(jc => {
      const partsTotal = (jc.parts || []).reduce((sum, p) => sum + ((p.sell_price || 0) * (p.qty || 1)), 0);
      const laborTotal = (jc.labor || []).reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
      const grandTotal = partsTotal + laborTotal;

      const isPaid = jc.status === 'Delivered';
      const paidAmount = isPaid ? grandTotal : 0;
      const balance = grandTotal - paidAmount;
      const statusBadge = isPaid ? '<span class="badge badge-ready">Paid</span>' : '<span class="badge badge-diagnosing">Pending</span>';

      return `
        <tr>
          <td><strong>INV-${jc.job_card_id || jc.id}</strong></td>
          <td>${jc.job_card_id || jc.id}</td>
          <td><span class="plate-badge">${jc.vehicle_plate}</span></td>
          <td><strong>${window.formatLKR(grandTotal)}</strong></td>
          <td>${window.formatLKR(paidAmount)}</td>
          <td>${window.formatLKR(balance)}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="window.GarageFlowBilling.downloadInvoice('${jc.id}')"><svg style="width:13px;height:13px;vertical-align:-2px;margin-right:4px;fill:currentColor;display:inline-block;" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>Download PDF</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  downloadInvoice: function(jobId) {
    const jc = window.GarageFlowJobCards
      ? window.GarageFlowJobCards.activeJobCards.find(j => j.id === jobId)
      : null;

    if (!jc) {
      alert('Job Card data not found for this invoice.');
      return;
    }

    if (window.ProTechPDF) {
      window.ProTechPDF.generateInvoice(jc);
    } else {
      alert('PDF generator is still loading. Please try again in a moment.');
    }
  }
};

