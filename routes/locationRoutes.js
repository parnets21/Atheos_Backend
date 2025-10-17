const express = require('express');
const router = express.Router();
const LocationTrackingController = require('../controller/LocationTrackingController');




// Start location tracking
router.post('/start-tracking', LocationTrackingController.startLocationTracking);

// Update employee location
router.post('/update-location', LocationTrackingController.updateLocation);

// Stop location tracking
router.post('/stop-tracking', LocationTrackingController.stopLocationTracking);

// Get employee location history (for admin)
router.get('/history', LocationTrackingController.getEmployeeLocationHistory);

// Get all active employee locations (for admin dashboard)
router.get('/active-locations', LocationTrackingController.getAllActiveLocations);

module.exports = router;
