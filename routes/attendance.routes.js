const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.js");
const AttendanceController = require("../controller/attendance.controller");
const Attendance = require("../models/Attendance");

// Base routes with appropriate authorization
// router.get("/", protect, authorize("admin", "siteManager", "assistantManager","client","topManagement","middleManagement","housekeeper"), AttendanceController.getAttendance);

router.get("/",  AttendanceController.getAttendance);
router.get("/getAllAttendance",  AttendanceController.getAllAttendance);



// Both authenticated and public endpoints for date-based attendance
router.get("/date/:date", protect, authorize("admin", "siteManager", "assistantManager","client","topManagement","middleManagement","housekeeper"), AttendanceController.getAttendanceByDate);
router.get("/public/date/:date", AttendanceController.getAttendanceByDate);
// GET /api/attendance/by-date?employeeId=...&date=YYYY-MM-DD
router.get('/by-date', AttendanceController.getAttendanceByDate);

// Mark attendance - accessible by site managers and above
router.post("/",
    protect,
    authorize("admin", "siteManager", "topManagement", "housekeeper","permanentReliever"),
    AttendanceController.markAttendance
);

router.post("/post",
    protect,
    authorize("admin", "siteManager", "topManagement", "housekeeper","permanentReliever"),
    AttendanceController.createOrUpdateAttendance
);

// Update attendance - add this route for admin and top management
router.put("/:id", protect, authorize("admin", "topManagement", "siteManager","middleManagement","permanentReliever"), AttendanceController.updateAttendance);

// Get attendance statistics - for admins and managers
router.get("/stats", protect, authorize("admin", "siteManager", "topManagement","middleManagement","permanentReliever"), AttendanceController.getAttendanceStats);

router.get("/statistic", AttendanceController.getAllAttendanceStatistic);


// Store specific route - for store managers and admins
router.get("/store/:storeId", protect, authorize("admin", "siteManager","middleManagement","permanentReliever"), AttendanceController.getStoreAttendance);

// Verification route - only clients can verify attendance
router.put("/:id/verify", protect, authorize("client"), AttendanceController.verifyAttendance);

router.post("/auto-mark-absent", async (req, res) => {
  await AttendanceController.autoMarkAbsentees();
  res.send("Absent employees marked successfully.");
});


// Get current location for an employee
router.get('/:employeeId/current-location', async (req, res) => {
  try {
    const attendance = await Attendance.findOne(
      { employeeId: req.params.employeeId, checkOut: null },
      'currentLocation lastLocationUpdate'
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'No active attendance record' });
    }
    
    res.json({
      currentLocation: attendance.currentLocation,
      lastUpdate: attendance.lastLocationUpdate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active employee locations (for admin dashboard)
router.get('/active/locations', async (req, res) => {
  try {
    const activeAttendances = await Attendance.find(
      { checkOut: null, currentLocation: { $exists: true } },
      'employeeId currentLocation lastLocationUpdate'
    ).populate('employeeId', 'name position');
    
    res.json(activeAttendances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;