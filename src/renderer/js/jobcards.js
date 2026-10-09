/**
 * ProTech ERP - Job Card CRUD Lifecycle & Firestore Engine
 */

window.GarageFlowJobCards = {
  activeJobCards: [],
  currentSelectedJobId: null,

  init: function() {
    this.bindFormEvents();
    this.listenToFirestore();
    console.log('[JobCards] Controller initialized');
  },

  // ----------------------------------------------------
  // 1. READ: REAL-TIME FIRESTORE LISTENER
  // ----------------------------------------------------
  listenToFirestore: function() {
    const renderTable = (docs) => {
      this.activeJobCards = docs;
      this.renderTable(docs);
      if (window.GarageFlowDashboard) {
        window.GarageFlowDashboard.updateStats(docs);
      }
      if (window.GarageFlowBilling) {
        window.GarageFlowBilling.renderInvoices(docs);
      }
    };

    // Wait for Firebase initialization
    const checkFirebase = setInterval(() => {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        clearInterval(checkFirebase);
        const db = window.GarageFlowFirebase.db;
        db.collection('job_cards').orderBy('created_at', 'desc')
          .onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach(doc => {
              list.push({ id: doc.id, ...doc.data() });
            });
            renderTable(list);
          }, (err) => {
            console.error('[JobCards] Firestore snapshot error:', err);
            const statusText = document.getElementById('firebase-status-text');
            const statusDot = document.querySelector('.status-indicator-badge .dot');
            if (err.code === 'permission-denied' || (err.message && err.message.includes('permissions'))) {
              if (statusText) statusText.textContent = 'Firestore Locked - Update Rules in Firebase Console';
              if (statusDot) statusDot.style.background = '#ef4444';
            }
          });
      }
    }, 300);
  },

  renderTable: function(jobCards) {
    const tbody = document.getElementById('jobcard-list');
    const dashboardTbody = document.getElementById('dashboard-recent-jobs');
    const vehicleTbody = document.getElementById('vehicle-list');

    if (!tbody) return;

    if (jobCards.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-dim);">No job cards found. Click "+ Create Job Card" to start!</td></tr>`;
      if (dashboardTbody) {
        dashboardTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No active job cards.</td></tr>`;
      }
      if (vehicleTbody) {
        vehicleTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No registered vehicles found.</td></tr>`;
      }
      return;
    }

    // Render Job Cards View Table
    tbody.innerHTML = jobCards.map(jc => {
      const statusClass = `badge-${jc.status ? jc.status.toLowerCase().replace(/\s+/g, '') : 'received'}`;
      const dateStr = jc.created_at && jc.created_at.toDate ? jc.created_at.toDate().toISOString().split('T')[0] : (jc.intake_date || 'Today');

      return `
        <tr>
          <td><strong>${jc.job_card_id || jc.id}</strong></td>
          <td><span class="plate-badge">${jc.vehicle_plate}</span></td>
          <td>${jc.customer_name || 'Walk-in'}</td>
          <td>${jc.problem || 'Service requested'}</td>
          <td>${dateStr}</td>
          <td><span class="badge ${statusClass}">${jc.status || 'Received'}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.GarageFlowJobCards.openDetailModal('${jc.id}')">View / Edit</button>
          </td>
        </tr>
      `;
    }).join('');

    // Render Dashboard Table (Active / In-progress jobs)
    if (dashboardTbody) {
      const activeJobs = jobCards.filter(j => j.status !== 'Delivered');
      if (activeJobs.length === 0) {
        dashboardTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No active jobs in workshop.</td></tr>`;
      } else {
        dashboardTbody.innerHTML = activeJobs.slice(0, 8).map(jc => {
          const statusClass = `badge-${jc.status ? jc.status.toLowerCase().replace(/\s+/g, '') : 'received'}`;
          return `
            <tr>
              <td><span class="plate-badge">${jc.vehicle_plate}</span></td>
              <td>${jc.vehicle_make_model || 'Vehicle'}</td>
              <td>${jc.customer_name || '-'}</td>
              <td>${jc.mechanic || 'Unassigned'}</td>
              <td><span class="badge ${statusClass}">${jc.status || 'Received'}</span></td>
              <td><button class="btn btn-secondary btn-sm" onclick="window.GarageFlowJobCards.openDetailModal('${jc.id}')">View</button></td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Vehicles Directory Table
    if (vehicleTbody) {
      const vehicleMap = {};
      jobCards.forEach(jc => {
        if (!vehicleMap[jc.vehicle_plate]) {
          vehicleMap[jc.vehicle_plate] = jc;
        }
      });

      const uniqueVehicles = Object.values(vehicleMap);
      vehicleTbody.innerHTML = uniqueVehicles.map(v => `
        <tr>
          <td><span class="plate-badge">${v.vehicle_plate}</span></td>
          <td>${v.vehicle_make_model || 'Standard Vehicle'}</td>
          <td>2022</td>
          <td>${v.customer_name}</td>
          <td>${v.customer_phone}</td>
          <td>${v.mileage_at_intake} km</td>
        </tr>
      `).join('');
    }
  },

  // ----------------------------------------------------
  // 2. CREATE: NEW JOB CARD FORM SUBMIT
  // ----------------------------------------------------
  bindFormEvents: function() {
    const form = document.getElementById('form-create-jobcard');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.createJobCard();
      });
    }

    // Modal Add Part Form
    const partForm = document.getElementById('form-add-part');
    if (partForm) {
      partForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitAddPart();
      });
    }

    // Modal Add Labor Form
    const laborForm = document.getElementById('form-add-labor');
    if (laborForm) {
      laborForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitAddLabor();
      });
    }

    // Save Diagnosis Button
    const saveDiagBtn = document.getElementById('btn-save-diagnosis');
    if (saveDiagBtn) {
      saveDiagBtn.addEventListener('click', async () => {
        await this.saveDiagnosis();
      });
    }

    // Delete Job Card Button
    const deleteBtn = document.getElementById('btn-delete-jobcard');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        await this.deleteCurrentJobCard();
      });
    }

    // Add Part / Labor Button Triggers
    const openAddPartBtn = document.getElementById('btn-open-add-part');
    if (openAddPartBtn) {
      openAddPartBtn.addEventListener('click', () => {
        window.openModal('modal-add-part');
      });
    }

    const openAddLaborBtn = document.getElementById('btn-open-add-labor');
    if (openAddLaborBtn) {
      openAddLaborBtn.addEventListener('click', () => {
        window.openModal('modal-add-labor');
      });
    }

    // Add Special Note Button + Form
    const openAddNoteBtn = document.getElementById('btn-open-add-special-note');
    if (openAddNoteBtn) {
      openAddNoteBtn.addEventListener('click', () => {
        window.openModal('modal-add-special-note');
      });
    }

    const noteForm = document.getElementById('form-add-special-note');
    if (noteForm) {
      noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitAddSpecialNote();
      });
    }

    // Stepper buttons
    const stepperBtns = document.querySelectorAll('#jc-status-stepper .step-btn');
    stepperBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetStatus = btn.getAttribute('data-status');
        if (targetStatus && this.currentSelectedJobId) {
          await this.updateStatus(this.currentSelectedJobId, targetStatus);
        }
      });
    });

    // Download Invoice PDF Button
    const printBtn = document.getElementById('btn-print-jc-invoice');
    if (printBtn) {
      printBtn.addEventListener('click', async () => {
        if (!this.currentSelectedJobId) return;
        const jc = this.activeJobCards.find(j => j.id === this.currentSelectedJobId);
        if (!jc) return;
        if (window.ProTechPDF) {
          printBtn.textContent = 'Generating...';
          printBtn.disabled = true;
          try {
            await window.ProTechPDF.generateInvoice(jc);
          } finally {
            printBtn.innerHTML = '<svg style="width:15px;height:15px;vertical-align:-2px;margin-right:6px;fill:currentColor;display:inline-block;" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>Download Invoice PDF';
            printBtn.disabled = false;
          }
        } else {
          alert('PDF generator not loaded yet. Please wait a moment.');
        }
      });
    }
  },

  createJobCard: async function() {
    const plate = document.getElementById('new-jc-plate').value.trim().toUpperCase();
    const makeModel = document.getElementById('new-jc-make-model').value.trim();
    const mileage = Number(document.getElementById('new-jc-mileage').value) || 0;
    const customerName = document.getElementById('new-jc-customer-name').value.trim();
    const customerPhone = document.getElementById('new-jc-customer-phone').value.trim();
    const mechanic = document.getElementById('new-jc-mechanic').value;
    const problem = document.getElementById('new-jc-problem').value.trim();

    // Check Business Rule: Only one active job card per vehicle plate
    const existingActive = this.activeJobCards.find(j => j.vehicle_plate === plate && j.status !== 'Delivered');
    if (existingActive) {
      alert(`Vehicle [${plate}] already has an active Job Card (${existingActive.job_card_id || 'JC'}). Please deliver or close the existing job card before creating a new one!`);
      return;
    }

    const jobCardId = `JC-${Math.floor(1000 + Math.random() * 9000)}`;

    let timestamp = new Date();
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
      timestamp = firebase.firestore.FieldValue.serverTimestamp();
    }

    const newDoc = {
      job_card_id: jobCardId,
      vehicle_plate: plate,
      vehicle_make_model: makeModel,
      mileage_at_intake: mileage,
      customer_name: customerName,
      customer_phone: customerPhone,
      mechanic: mechanic,
      problem: problem,
      diagnosis: '',
      status: 'Received',
      parts: [],
      labor: [],
      locked: false,
      created_at: timestamp,
      intake_date: new Date().toISOString().split('T')[0]
    };

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').add(newDoc);
        console.log('[JobCards] Created Job Card in Firestore:', jobCardId);
      } else {
        // Fallback for memory store if Firestore is not initialized
        newDoc.id = jobCardId;
        this.activeJobCards.unshift(newDoc);
        this.renderTable(this.activeJobCards);
      }

      // Close modal and reset form
      window.closeModal('modal-new-jobcard');
      const form = document.getElementById('form-create-jobcard');
      if (form) form.reset();

      console.log(`Job Card ${jobCardId} successfully created for ${plate}`);
    } catch (err) {
      console.error('[JobCards] Create error:', err);
      // Fallback: save to local activeJobCards list so user experience is not blocked
      newDoc.id = jobCardId;
      if (!this.activeJobCards.some(j => j.id === jobCardId)) {
        this.activeJobCards.unshift(newDoc);
        this.renderTable(this.activeJobCards);
      }
      window.closeModal('modal-new-jobcard');
      const form = document.getElementById('form-create-jobcard');
      if (form) form.reset();

      if (err.code === 'permission-denied' || (err.message && err.message.includes('permissions'))) {
        alert(`Job Card ${jobCardId} created in local view!\n\nNote: Firebase Firestore returned 'Missing or insufficient permissions'. Please update your Firestore Security Rules in Firebase Console.`);
      } else {
        alert(`Job Card ${jobCardId} created locally: ` + (err.message || 'Saved to view'));
      }
    }
  },

  // ----------------------------------------------------
  // 3. UPDATE: OPEN DETAIL & MANAGE WORKFLOW
  // ----------------------------------------------------
  openDetailModal: function(docId) {
    const jc = this.activeJobCards.find(j => j.id === docId || j.job_card_id === docId);
    if (!jc) return;

    this.currentSelectedJobId = jc.id;

    // Header & Meta
    document.getElementById('detail-jc-id').textContent = jc.job_card_id || jc.id;
    document.getElementById('detail-jc-plate').textContent = jc.vehicle_plate;
    
    const statusBadge = document.getElementById('detail-jc-status');
    statusBadge.textContent = jc.status || 'Received';
    statusBadge.className = `badge badge-${(jc.status || 'received').toLowerCase().replace(/\s+/g, '')}`;

    document.getElementById('detail-jc-info').textContent = `${jc.vehicle_make_model || 'Vehicle'} • ${jc.customer_name} (${jc.customer_phone})`;
    document.getElementById('detail-jc-meta').textContent = `${jc.mileage_at_intake.toLocaleString()} km • Technician: ${jc.mechanic || 'Unassigned'}`;
    document.getElementById('detail-jc-problem').textContent = jc.problem || 'No complaint notes.';
    document.getElementById('detail-jc-diagnosis').value = jc.diagnosis || '';

    // Update Stepper buttons active state
    const stepperBtns = document.querySelectorAll('#jc-status-stepper .step-btn');
    const statuses = ['Received', 'Diagnosing', 'In Repair', 'Ready', 'Delivered'];
    const currentIndex = statuses.indexOf(jc.status || 'Received');

    stepperBtns.forEach((btn, idx) => {
      btn.classList.remove('active', 'completed');
      if (idx === currentIndex) {
        btn.classList.add('active');
      } else if (idx < currentIndex) {
        btn.classList.add('completed');
      }
    });

    // Render Parts, Labor, and Special Notes Line Items & Calculate Totals
    this.renderLineItems(jc);
    this.renderSpecialNotes(jc);

    window.openModal('modal-jobcard-detail');
  },

  renderLineItems: function(jc) {
    const partsTbody = document.getElementById('detail-jc-parts-list');
    const laborTbody = document.getElementById('detail-jc-labor-list');

    let partsTotal = 0;
    let partsCostTotal = 0;

    const parts = jc.parts || [];
    if (parts.length === 0) {
      partsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-dim);">No parts added to this job card yet.</td></tr>`;
    } else {
      partsTbody.innerHTML = parts.map((p, idx) => {
        const lineSellTotal = (p.sell_price || 0) * (p.qty || 1);
        const lineCostTotal = (p.cost_price || 0) * (p.qty || 1);
        const margin = lineSellTotal - lineCostTotal;

        partsTotal += lineSellTotal;
        partsCostTotal += lineCostTotal;

        return `
          <tr>
            <td><strong>${p.part_name}</strong></td>
            <td>${window.formatLKR(p.cost_price)}</td>
            <td>${window.formatLKR(p.sell_price)}</td>
            <td>${p.qty}</td>
            <td class="profit-text">+${window.formatLKR(margin)}</td>
            <td><strong>${window.formatLKR(lineSellTotal)}</strong></td>
            <td><button class="btn btn-danger btn-sm" onclick="window.GarageFlowJobCards.deletePart(${idx})">&times;</button></td>
          </tr>
        `;
      }).join('');
    }

    let laborTotal = 0;
    const labor = jc.labor || [];
    if (labor.length === 0) {
      laborTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-dim);">No labor charges added to this job card yet.</td></tr>`;
    } else {
      laborTbody.innerHTML = labor.map((l, idx) => {
        const lineAmount = (l.hours || 0) * (l.rate || 0);
        laborTotal += lineAmount;

        return `
          <tr>
            <td><strong>${l.description}</strong></td>
            <td>${l.hours} hrs</td>
            <td>${window.formatLKR(l.rate)}</td>
            <td><strong>${window.formatLKR(lineAmount)}</strong></td>
            <td><button class="btn btn-danger btn-sm" onclick="window.GarageFlowJobCards.deleteLabor(${idx})">&times;</button></td>
          </tr>
        `;
      }).join('');
    }

    const grandTotal = partsTotal + laborTotal;
    const partsProfitMargin = partsTotal - partsCostTotal;

    document.getElementById('summary-parts-total').textContent = window.formatLKR(partsTotal);
    document.getElementById('summary-labor-total').textContent = window.formatLKR(laborTotal);
    document.getElementById('summary-parts-profit').textContent = window.formatLKR(partsProfitMargin);
    document.getElementById('summary-grand-total').textContent = window.formatLKR(grandTotal);
  },

  updateStatus: async function(docId, newStatus) {
    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(docId).update({
          status: newStatus,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      this.openDetailModal(docId);
    } catch (err) {
      console.error('[JobCards] Update status error:', err);
    }
  },

  saveDiagnosis: async function() {
    if (!this.currentSelectedJobId) return;
    const diagText = document.getElementById('detail-jc-diagnosis').value.trim();
    const diagTextarea = document.getElementById('detail-jc-diagnosis');

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(this.currentSelectedJobId).update({
          diagnosis: diagText
        });
      }
      // Use a non-blocking toast instead of alert() to avoid focus lock
      this._showToast('Diagnosis notes saved successfully!', 'success');
      // Return focus to the textarea so user can keep typing
      if (diagTextarea) diagTextarea.focus();
    } catch (err) {
      this._showToast('Failed to save diagnosis: ' + err.message, 'error');
    }
  },

  // Non-blocking toast notification helper
  _showToast: function(message, type = 'success') {
    const existing = document.getElementById('protech-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'protech-toast';
    toast.textContent = message;
    toast.style.cssText = [
      'position: fixed',
      'bottom: 2rem',
      'right: 2rem',
      'z-index: 9999',
      'padding: 0.85rem 1.5rem',
      'border-radius: 10px',
      'font-family: var(--font-main)',
      'font-size: 0.9rem',
      'font-weight: 600',
      'color: #fff',
      'box-shadow: 0 8px 24px rgba(0,0,0,0.4)',
      'pointer-events: none',
      'transition: opacity 0.4s ease',
      type === 'success'
        ? 'background: linear-gradient(135deg, #10b981, #059669)'
        : 'background: linear-gradient(135deg, #ef4444, #dc2626)'
    ].join(';');

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  },

  submitAddPart: async function() {
    if (!this.currentSelectedJobId) return;
    const jc = this.activeJobCards.find(j => j.id === this.currentSelectedJobId);
    if (!jc) return;

    const name = document.getElementById('part-name').value.trim();
    const cost = Number(document.getElementById('part-cost').value) || 0;
    const sell = Number(document.getElementById('part-sell').value) || 0;
    const qty = Number(document.getElementById('part-qty').value) || 1;

    const currentParts = jc.parts || [];
    currentParts.push({ part_name: name, cost_price: cost, sell_price: sell, qty: qty });

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(this.currentSelectedJobId).update({
          parts: currentParts
        });
      }
      window.closeModal('modal-add-part');
      document.getElementById('form-add-part').reset();
      this.openDetailModal(this.currentSelectedJobId);
    } catch (err) {
      alert('Failed to add part: ' + err.message);
    }
  },

  deletePart: async function(index) {
    if (!this.currentSelectedJobId) return;
    const jc = this.activeJobCards.find(j => j.id === this.currentSelectedJobId);
    if (!jc) return;

    const currentParts = jc.parts || [];
    currentParts.splice(index, 1);

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(this.currentSelectedJobId).update({
          parts: currentParts
        });
      }
      this.openDetailModal(this.currentSelectedJobId);
    } catch (err) {
      alert('Failed to delete part: ' + err.message);
    }
  },

  submitAddLabor: async function() {
    if (!this.currentSelectedJobId) return;
    const jc = this.activeJobCards.find(j => j.id === this.currentSelectedJobId);
    if (!jc) return;

    const desc = document.getElementById('labor-desc').value.trim();
    const hours = Number(document.getElementById('labor-hours').value) || 1;
    const rate = Number(document.getElementById('labor-rate').value) || 0;

    const currentLabor = jc.labor || [];
    currentLabor.push({ description: desc, hours: hours, rate: rate });

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(this.currentSelectedJobId).update({
          labor: currentLabor
        });
      }
      window.closeModal('modal-add-labor');
      document.getElementById('form-add-labor').reset();
      this.openDetailModal(this.currentSelectedJobId);
    } catch (err) {
      alert('Failed to add labor task: ' + err.message);
    }
  },

  deleteLabor: async function(index) {
    if (!this.currentSelectedJobId) return;
    const jc = this.activeJobCards.find(j => j.id === this.currentSelectedJobId);
    if (!jc) return;

    const currentLabor = jc.labor || [];
    currentLabor.splice(index, 1);

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(this.currentSelectedJobId).update({
          labor: currentLabor
        });
      }
      this.openDetailModal(this.currentSelectedJobId);
    } catch (err) {
      alert('Failed to delete labor: ' + err.message);
    }
  },

  // ── SPECIAL NOTES ─────────────────────────────────────────
  renderSpecialNotes: function(jc) {
    const tbody = document.getElementById('detail-jc-special-notes-list');
    if (!tbody) return;
    const notes = jc.special_notes || [];
    if (notes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-dim);">No special notes added yet.</td></tr>`;
    } else {
      tbody.innerHTML = notes.map((note, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${note}</td>
          <td><button class="btn btn-danger btn-sm" onclick="window.GarageFlowJobCards.deleteSpecialNote(${idx})">&times;</button></td>
        </tr>
      `).join('');
    }
  },

  submitAddSpecialNote: async function() {
    if (!this.currentSelectedJobId) return;
    const jc = this.activeJobCards.find(j => j.id === this.currentSelectedJobId);
    if (!jc) return;

    const noteText = document.getElementById('special-note-text').value.trim();
    if (!noteText) return;

    const currentNotes = jc.special_notes || [];
    currentNotes.push(noteText.toUpperCase());

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(this.currentSelectedJobId).update({
          special_notes: currentNotes
        });
      } else {
        jc.special_notes = currentNotes;
      }
      window.closeModal('modal-add-special-note');
      document.getElementById('form-add-special-note').reset();
      this.openDetailModal(this.currentSelectedJobId);
    } catch (err) {
      alert('Failed to add special note: ' + err.message);
    }
  },

  deleteSpecialNote: async function(index) {
    if (!this.currentSelectedJobId) return;
    const jc = this.activeJobCards.find(j => j.id === this.currentSelectedJobId);
    if (!jc) return;

    const currentNotes = jc.special_notes || [];
    currentNotes.splice(index, 1);

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(this.currentSelectedJobId).update({
          special_notes: currentNotes
        });
      } else {
        jc.special_notes = currentNotes;
      }
      this.openDetailModal(this.currentSelectedJobId);
    } catch (err) {
      alert('Failed to delete special note: ' + err.message);
    }
  },

  // ----------------------------------------------------
  // 4. DELETE / VOID JOB CARD
  // ----------------------------------------------------
  deleteCurrentJobCard: async function() {
    if (!this.currentSelectedJobId) return;
    if (!confirm('Are you sure you want to delete this Job Card? This action cannot be undone.')) return;

    try {
      if (window.GarageFlowFirebase && window.GarageFlowFirebase.db) {
        await window.GarageFlowFirebase.db.collection('job_cards').doc(this.currentSelectedJobId).delete();
      }
      window.closeModal('modal-jobcard-detail');
      alert('Job Card deleted successfully.');
    } catch (err) {
      alert('Failed to delete Job Card: ' + err.message);
    }
  },

  searchByPlate: function(plate) {
    const match = this.activeJobCards.find(j => j.vehicle_plate === plate);
    if (match) {
      this.openDetailModal(match.id);
    } else {
      alert(`No active Job Card found for vehicle plate: ${plate}`);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.GarageFlowJobCards) {
    window.GarageFlowJobCards.init();
  }
});
