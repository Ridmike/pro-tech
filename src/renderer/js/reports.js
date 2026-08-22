/**
 * GarageFlow ERP - Reports & Analytics Controller
 */

window.GarageFlowReports = {
  calculatePartsProfit: function(partsList) {
    return partsList.reduce((acc, item) => {
      const margin = (item.sellPrice - item.costPrice) * item.qty;
      return acc + margin;
    }, 0);
  }
};
