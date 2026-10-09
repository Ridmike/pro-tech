/**
 * ProTech ERP - Vehicle History Module
 * Reads job cards, groups by plate, shows per-vehicle service timeline.
 */

window.GarageFlowVehicleHistory = {
  _allJobCards: [],
  _selectedPlate: null,

  /** Called by jobcards.js after Firestore snapshot updates */
  updateFromJobCards: function(jobCards) {
    this._allJobCards = jobCards;
    this._renderVehicleList(jobCards);
    // If a vehicle is already selected, refresh its timeline
    if (this._selectedPlate) {
      this._showHistory(this._selectedPlate);
    }
  },

  /** Build the left-panel vehicle list */
  _renderVehicleList: function(jobCards) {
    const container = document.getElementById('vh-vehicle-list');
    if (!container) return;

    // Build unique vehicle map keyed by plate
    const vehicleMap = {};
    jobCards.forEach(jc => {
      const plate = jc.vehicle_plate;
      if (!vehicleMap[plate]) {
        vehicleMap[plate] = {
          plate,
          name: jc.vehicle_make_model || 'Vehicle',
          owner: jc.customer_name || '-',
          phone: jc.customer_phone || '-',
          visits: 0,
          lastMileage: 0,
          totalSpend: 0
        };
      }
      vehicleMap[plate].visits++;
      const mileage = Number(jc.mileage_at_intake) || 0;
      if (mileage > vehicleMap[plate].lastMileage) {
        vehicleMap[plate].lastMileage = mileage;
      }
      // Total spend = all parts sell totals + labor totals
      (jc.parts || []).forEach(p => {
        vehicleMap[plate].totalSpend += (p.sell_price || 0) * (p.qty || 1);
      });
      (jc.labor || []).forEach(l => {
        vehicleMap[plate].totalSpend += (l.hours || 0) * (l.rate || 0);
      });
    });

    const vehicles = Object.values(vehicleMap);

    // Apply plate filter
    const filterInput = document.getElementById('vh-plate-filter');
    const filterVal = (filterInput ? filterInput.value : '').trim().toUpperCase();
    const filtered = filterVal
      ? vehicles.filter(v => v.plate.toUpperCase().includes(filterVal))
      : vehicles;

    if (filtered.length === 0) {
      container.innerHTML = '<div class="vh-empty">No vehicles match the filter.</div>';
      return;
    }

    container.innerHTML = filtered.map(v => `
      <div class="vh-vehicle-card ${this._selectedPlate === v.plate ? 'active' : ''}"
           onclick="window.GarageFlowVehicleHistory._showHistory('${v.plate}')">
        <div class="vh-vehicle-card-top">
          <span class="plate-badge">${v.plate}</span>
          <span class="vh-visits-pill">${v.visits} visit${v.visits !== 1 ? 's' : ''}</span>
        </div>
        <div class="vh-vehicle-card-name">${v.name}</div>
        <div class="vh-vehicle-card-owner">${v.owner} &bull; ${v.phone}</div>
        <div class="vh-vehicle-card-mileage">${v.lastMileage.toLocaleString()} km last recorded</div>
      </div>
    `).join('');
  },

  /** Show service history timeline for a given plate */
  _showHistory: function(plate) {
    this._selectedPlate = plate;

    // Re-render list to reflect active highlight
    this._renderVehicleList(this._allJobCards);

    const placeholder = document.getElementById('vh-history-placeholder');
    const content = document.getElementById('vh-history-content');
    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'block';

    // Get all job cards for this plate sorted by date (oldest first)
    const jcs = this._allJobCards
      .filter(jc => jc.vehicle_plate === plate)
      .sort((a, b) => {
        const da = a.created_at && a.created_at.toDate ? a.created_at.toDate() : new Date(a.intake_date || 0);
        const db = b.created_at && b.created_at.toDate ? b.created_at.toDate() : new Date(b.intake_date || 0);
        return da - db;
      });

    if (jcs.length === 0) {
      document.getElementById('vh-timeline').innerHTML = '<div class="vh-empty" style="padding:2rem">No records found for this vehicle.</div>';
      return;
    }

    // Summary metrics
    const latestJc = jcs[jcs.length - 1];
    const vehicle = latestJc;
    let totalSpend = 0;
    jcs.forEach(jc => {
      (jc.parts || []).forEach(p => totalSpend += (p.sell_price || 0) * (p.qty || 1));
      (jc.labor || []).forEach(l => totalSpend += (l.hours || 0) * (l.rate || 0));
    });

    document.getElementById('vh-selected-plate').textContent = plate;
    document.getElementById('vh-selected-name').textContent = vehicle.vehicle_make_model || 'Vehicle';
    document.getElementById('vh-total-visits').textContent = `${jcs.length} Visit${jcs.length !== 1 ? 's' : ''}`;
    document.getElementById('vh-total-spend').textContent = window.formatLKR ? window.formatLKR(totalSpend) : `LKR ${totalSpend.toFixed(2)}`;
    document.getElementById('vh-last-mileage').textContent = `${(Number(latestJc.mileage_at_intake) || 0).toLocaleString()} km`;

    // Build timeline (newest first)
    const reversed = [...jcs].reverse();
    const timelineEl = document.getElementById('vh-timeline');
    timelineEl.innerHTML = reversed.map((jc, idx) => {
      const dateStr = jc.created_at && jc.created_at.toDate
        ? jc.created_at.toDate().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })
        : (jc.intake_date || 'Date unknown');

      const parts = jc.parts || [];
      const labor = jc.labor || [];
      let jcPartsTotal = 0;
      let jcLaborTotal = 0;
      parts.forEach(p => jcPartsTotal += (p.sell_price || 0) * (p.qty || 1));
      labor.forEach(l => jcLaborTotal += (l.hours || 0) * (l.rate || 0));
      const jcTotal = jcPartsTotal + jcLaborTotal;

      const statusClass = `badge-${(jc.status || 'received').toLowerCase().replace(/\s+/g, '')}`;
      const lkr = window.formatLKR || (v => `LKR ${Number(v).toFixed(2)}`);

      const partsRows = parts.length > 0
        ? parts.map(p => `
            <tr>
              <td>${p.part_name}</td>
              <td style="text-align:center;">${p.qty}</td>
              <td style="text-align:right;">${lkr(p.sell_price)}</td>
              <td style="text-align:right;font-weight:600;">${lkr((p.sell_price || 0) * (p.qty || 1))}</td>
            </tr>`).join('')
        : `<tr><td colspan="4" class="vh-table-empty">No parts used in this visit</td></tr>`;

      const laborRows = labor.length > 0
        ? labor.map(l => `
            <tr>
              <td>${l.description}</td>
              <td style="text-align:center;">${l.hours} hrs</td>
              <td style="text-align:right;">${lkr(l.rate)}/hr</td>
              <td style="text-align:right;font-weight:600;">${lkr((l.hours || 0) * (l.rate || 0))}</td>
            </tr>`).join('')
        : `<tr><td colspan="4" class="vh-table-empty">No labor charges in this visit</td></tr>`;

      return `
        <div class="vh-entry">
          <div class="vh-entry-timeline">
            <div class="vh-dot ${idx === 0 ? 'vh-dot-latest' : ''}"></div>
            ${idx < reversed.length - 1 ? '<div class="vh-line"></div>' : ''}
          </div>
          <div class="vh-entry-card">
            <div class="vh-entry-header">
              <div class="vh-entry-meta">
                <span class="vh-entry-date">${dateStr}</span>
                <span class="badge ${statusClass}">${jc.status || 'Received'}</span>
                <span class="vh-entry-jcid">${jc.job_card_id || jc.id}</span>
              </div>
              <div class="vh-entry-mileage" style="display:flex; align-items:center; gap:0.5rem;">
                <span><span class="vh-mileage-icon">&#128205;</span> ${(Number(jc.mileage_at_intake) || 0).toLocaleString()} km</span>
                <button class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onclick="window.GarageFlowBilling.downloadInvoice('${jc.id}')" title="Download Invoice PDF"><svg style="width:12px;height:12px;vertical-align:-1px;margin-right:3px;fill:currentColor;display:inline-block;" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>Invoice PDF</button>
              </div>
            </div>

            ${jc.problem ? `<div class="vh-entry-problem"><strong>Complaint:</strong> ${jc.problem}</div>` : ''}
            ${jc.diagnosis ? `<div class="vh-entry-diagnosis"><strong>Diagnosis:</strong> ${jc.diagnosis}</div>` : ''}

            <!-- Parts Table -->
            <div class="vh-section-label">&#128296; Parts Used</div>
            <div class="vh-inner-table-wrap">
              <table class="vh-inner-table">
                <thead>
                  <tr>
                    <th>Part Name</th>
                    <th style="text-align:center;">Qty</th>
                    <th style="text-align:right;">Unit Price</th>
                    <th style="text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>${partsRows}</tbody>
              </table>
            </div>

            <!-- Labor Table -->
            <div class="vh-section-label" style="margin-top:0.75rem;">&#128295; Labor / Services</div>
            <div class="vh-inner-table-wrap">
              <table class="vh-inner-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align:center;">Hours</th>
                    <th style="text-align:right;">Rate</th>
                    <th style="text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>${laborRows}</tbody>
              </table>
            </div>

            <!-- Visit Total -->
            <div class="vh-entry-total">
              <span>Parts: <strong>${lkr(jcPartsTotal)}</strong></span>
              <span>Labor: <strong>${lkr(jcLaborTotal)}</strong></span>
              <span class="vh-entry-grand">Visit Total: <strong>${lkr(jcTotal)}</strong></span>
            </div>

            ${jc.mechanic ? `<div class="vh-entry-mechanic">&#128295; Technician: <strong>${jc.mechanic}</strong></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
};

// Hook into the JobCards data stream so history stays live
document.addEventListener('DOMContentLoaded', () => {
  // Patch GarageFlowJobCards.listenToFirestore to also notify VehicleHistory
  const _origRender = window.GarageFlowJobCards
    ? window.GarageFlowJobCards.renderTable
    : null;

  if (_origRender) {
    window.GarageFlowJobCards.renderTable = function(jobCards) {
      _origRender.call(this, jobCards);
      if (window.GarageFlowVehicleHistory) {
        window.GarageFlowVehicleHistory.updateFromJobCards(jobCards);
      }
    };
  }

  // Plate filter live search
  const filterInput = document.getElementById('vh-plate-filter');
  if (filterInput) {
    filterInput.addEventListener('input', () => {
      if (window.GarageFlowVehicleHistory) {
        window.GarageFlowVehicleHistory._renderVehicleList(
          window.GarageFlowVehicleHistory._allJobCards
        );
      }
    });
  }
});
