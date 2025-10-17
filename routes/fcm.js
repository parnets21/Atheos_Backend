const express = require("express")
const router = express.Router()
const FCMController = require("../controller/FCMController")
const FCMService = require("../services/FCMService")

// Update FCM token for employee
router.post("/update-token", FCMController.updateFCMToken)

// Admin request location via FCM
router.post("/request-location", FCMController.requestLocationFCM)

// Bulk location request
router.post("/request-bulk-location", FCMController.requestBulkLocationFCM)
// router.post("/save-fcm-token", FCMController.requestBulkLocationFCM)
router.post("/admin-location-response", FCMController.adminLocationResponse)

module.exports = router
