/**
 * GarageFlow ERP - Authentication & Role Permission Module
 */

window.GarageFlowAuth = {
  currentUser: {
    uid: 'admin-001',
    displayName: 'Admin User',
    email: 'admin@garageflow.com',
    role: 'admin' // 'admin' | 'staff'
  },

  isAdmin: function() {
    return this.currentUser && this.currentUser.role === 'admin';
  },

  checkPermission: function(action) {
    const adminOnlyActions = [
      'apply_discount',
      'reopen_jobcard',
      'manage_users',
      'global_settings'
    ];

    if (adminOnlyActions.includes(action)) {
      return this.isAdmin();
    }
    return true;
  }
};
