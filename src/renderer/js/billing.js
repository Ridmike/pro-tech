/**
 * GarageFlow ERP - Billing & Invoicing Module
 */

window.GarageFlowBilling = {
  calculateTotal: function(partsTotal, laborTotal, discount, taxRate) {
    const subtotal = partsTotal + laborTotal;
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const taxAmount = (taxableSubtotal * taxRate) / 100;
    const total = taxableSubtotal + taxAmount;
    return { subtotal, taxableSubtotal, taxAmount, total };
  }
};
