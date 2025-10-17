const LocationTracking = require("../models/LocationTracking");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

class LocationTrackingController {
  // Calculate distance between two coordinates using Haversine formula
  calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Start location tracking when employee checks in
  startLocationTracking = async (req, res) => {
    try {
      const { employeeId, attendanceId, latitude, longitude, address } = req.body;

      if (!employeeId || !attendanceId || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Check if tracking already exists for this attendance
      let tracking = await LocationTracking.findOne({
        employeeId,
        attendanceId,
      });

      if (tracking) {
        return res.status(200).json({
          success: true,
          message: "Location tracking already active",
          data: tracking,
        });
      }

      // Create new location tracking
      tracking = new LocationTracking({
        employeeId,
        attendanceId,
        locations: [
          {
            latitude,
            longitude,
            address: address || "Check-in location",
            timestamp: new Date(),
            distanceFromPrevious: 0,
          },
        ],
        isActive: true,
        lastLocationUpdate: new Date(),
      });

      await tracking.save();

      return res.status(201).json({
        success: true,
        message: "Location tracking started",
        data: tracking,
      });
    } catch (error) {
      console.error("Start location tracking error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };

  // Update employee location (only if moved more than 200m)
  updateLocation = async (req, res) => {
    try {
      const { employeeId, attendanceId, latitude, longitude, address } = req.body;

      if (!employeeId || !attendanceId || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const tracking = await LocationTracking.findOne({
        employeeId,
        attendanceId,
        isActive: true,
      });

      if (!tracking) {
        return res.status(404).json({
          success: false,
          message: "No active location tracking found",
        });
      }

      const lastLocation = tracking.locations[tracking.locations.length - 1];
      const distance = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        latitude,
        longitude
      );

      // Only update if moved more than 200 meters
      if (distance >= 0.5) {
        const newLocation = {
          latitude,
          longitude,
          address: address || "Updated location",
          timestamp: new Date(),
          distanceFromPrevious: Math.round(distance),
        };

        tracking.locations.push(newLocation);
        tracking.totalDistanceTraveled += Math.round(distance);
        tracking.lastLocationUpdate = new Date();

        await tracking.save();

        return res.status(200).json({
          success: true,
          message: "Location updated",
          data: {
            distanceMoved: Math.round(distance),
            totalDistance: tracking.totalDistanceTraveled,
            newLocation,
          },
        });
      } else {
        // Update last location update time even if not saving new location
        tracking.lastLocationUpdate = new Date();
        await tracking.save();

        return res.status(200).json({
          success: true,
          message: "Location checked - no significant movement",
          data: {
            distanceMoved: Math.round(distance),
            threshold: 200,
          },
        });
      }
    } catch (error) {
      console.error("Update location error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };

  // Stop location tracking when employee checks out
  stopLocationTracking = async (req, res) => {
    try {
      const { employeeId, attendanceId } = req.body;

      const tracking = await LocationTracking.findOne({
        employeeId,
        attendanceId,
        isActive: true,
      });

      if (!tracking) {
        return res.status(404).json({
          success: false,
          message: "No active location tracking found",
        });
      }

      tracking.isActive = false;
      await tracking.save();

      return res.status(200).json({
        success: true,
        message: "Location tracking stopped",
        data: {
          totalLocations: tracking.locations.length,
          totalDistance: tracking.totalDistanceTraveled,
        },
      });
    } catch (error) {
      console.error("Stop location tracking error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };

  // Get employee's location history for admin
  getEmployeeLocationHistory = async (req, res) => {
    try {
      const { employeeId, attendanceId } = req.query;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required",
        });
      }

      let query = { employeeId };
      if (attendanceId) {
        query.attendanceId = attendanceId;
      }

      const trackingRecords = await LocationTracking.find(query)
        .populate("employeeId", "Name EmployeeCode")
        .populate("attendanceId", "date checkIn checkOut")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: trackingRecords,
      });
    } catch (error) {
      console.error("Get location history error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };

  // Get all active employee locations for admin dashboard
  getAllActiveLocations = async (req, res) => {
    try {
      const activeTrackings = await LocationTracking.find({ isActive: true })
        .populate("employeeId", "Name EmployeeCode")
        .populate("attendanceId", "date checkIn checkOut store")
        .sort({ lastLocationUpdate: -1 });

      const formattedData = activeTrackings.map((tracking) => {
        const lastLocation = tracking.locations[tracking.locations.length - 1];
        const isOnline = new Date() - new Date(tracking.lastLocationUpdate) < 300000; // 5 minutes

        return {
          employeeId: tracking.employeeId._id,
          employeeName: tracking.employeeId.Name,
          employeeCode: tracking.employeeId.EmployeeCode,
          attendanceId: tracking.attendanceId._id,
          checkInTime: tracking.attendanceId.checkIn,
          store: tracking.attendanceId.store,
          currentLocation: lastLocation,
          totalLocations: tracking.locations.length,
          totalDistance: tracking.totalDistanceTraveled,
          lastUpdate: tracking.lastLocationUpdate,
          isOnline,
          status: isOnline ? "online" : "offline",
        };
      });

      return res.status(200).json({
        success: true,
        data: formattedData,
      });
    } catch (error) {
      console.error("Get all active locations error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
}

module.exports = new LocationTrackingController();
