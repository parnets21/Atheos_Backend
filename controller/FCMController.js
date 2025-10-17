// const FCMToken = require("../models/FCMToken")
// const Employee = require("../models/Employee")
// const FCMService = require("../services/FCMService")
// const LocationResponse = require("../models/LocationResponse")
// class FCMController {
//   // Store/update FCM token for employee
//   updateFCMToken = async (req, res) => {
//     try {
//       const { employeeId, token, deviceId, platform } = req.body

//       if (!employeeId || !token || !deviceId || !platform) {
//         return res.status(400).json({
//           success: false,
//           message: "Missing required fields: employeeId, token, deviceId, platform",
//         })
//       }

//       // Verify employee exists
//       const employee = await Employee.findById(employeeId)
//       if (!employee) {
//         return res.status(404).json({
//           success: false,
//           message: "Employee not found",
//         })
//       }

//       // Update or create FCM token
//       const fcmToken = await FCMToken.findOneAndUpdate(
//         { employeeId },
//         {
//           token,
//           deviceId,
//           platform,
//           isActive: true,
//           lastUpdated: new Date(),
//         },
//         { upsert: true, new: true },
//       )

//       res.json({
//         success: true,
//         message: "FCM token updated successfully",
//         data: { tokenId: fcmToken._id },
//       })
//     } catch (error) {
//       console.error("Error updating FCM token:", error)
//       res.status(500).json({
//         success: false,
//         message: "Internal server error",
//       })
//     }
//   }

//   // Admin endpoint to request location via FCM
//   requestLocationFCM = async (req, res) => {
//     try {
//       const { employeeId, adminId } = req.body

//       if (!employeeId || !adminId) {
//         return res.status(400).json({
//           success: false,
//           message: "Employee ID and Admin ID are required",
//         })
//       }

//       // Get employee's FCM token
//       const fcmToken = await FCMToken.findOne({
//         employeeId,
//         isActive: true,
//       })

//       if (!fcmToken) {
//         return res.status(404).json({
//           success: false,
//           message: "Employee FCM token not found or inactive",
//         })
//       }

//       // Send FCM location request
//       const result = await FCMService.sendLocationRequest(fcmToken.fcmToken, employeeId, adminId)

//       console.log(result)

//       if (result.success) {
//         res.json({
//           success: true,
//           message: "Location request sent via FCM",
//           data: { messageId: result.messageId },
//         })
//       } else {
//         res.status(500).json({
//           success: false,
//           message: "Failed to send FCM location request",
//           error: result.error,
//         })
//       }
//     } catch (error) {
//       console.error("Error requesting location via FCM:", error)
//       res.status(500).json({
//         success: false,
//         message: "Internal server error",
//       })
//     }
//   }

//   // Bulk location request for multiple employees
//   requestBulkLocationFCM = async (req, res) => {
//     try {
//       const { employeeIds, adminId } = req.body

//       if (!employeeIds || !Array.isArray(employeeIds) || !adminId) {
//         return res.status(400).json({
//           success: false,
//           message: "Employee IDs array and Admin ID are required",
//         })
//       }

//       // Get FCM tokens for all employees
//       const fcmTokens = await FCMToken.find({
//         employeeId: { $in: employeeIds },
//         isActive: true,
//       })

//       if (fcmTokens.length === 0) {
//         return res.status(404).json({
//           success: false,
//           message: "No active FCM tokens found for specified employees",
//         })
//       }

//       const tokens = fcmTokens.map((fcm) => ({
//         token: fcm.token,
//         employeeId: fcm.employeeId,
//       }))

//       // Send bulk FCM location requests
//       const result = await FCMService.sendBulkLocationRequests(tokens, adminId)

//       res.json({
//         success: true,
//         message: `Location requests sent to ${tokens.length} employees`,
//         data: {
//           totalSent: tokens.length,
//           results: result.results,
//         },
//       })
//     } catch (error) {
//       console.error("Error sending bulk location requests:", error)
//       res.status(500).json({
//         success: false,
//         message: "Internal server error",
//       })
//     }
//   }

//   saveToken = async (req, res) => {
//     const { userId, fcmToken } = req.body;

//     try {
//       await Employee.findByIdAndUpdate(userId, { fcmToken }, { new: true });
//       res.json({ success: true, message: "FCM token saved" });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   }
//   adminLocationResponse = async (req, res) => {
//   try {
//     const { employeeId, adminId, requestId, location, timestamp } = req.body;

//     // if (!employeeId || !adminId || !requestId || !location) {
//     //   return res.status(400).json({ success: false, message: "Missing required fields" });
//     // }

//     // Optional: validate employee & admin exist
//     const employee = await Employee.findById(employeeId);
//     // const admin = await Admin.findById(adminId);

//     if (!employee ) {
//       return res.status(404).json({ success: false, message: "Employee or Admin not found" });
//     }

//     // Save response
//     const newResponse = new LocationResponse({
//       employeeId,
//       adminId,
//       requestId,
//       location,
//       timestamp,
//     });

//     await newResponse.save();

//     return res.status(201).json({
//       success: true,
//       message: "Location response saved successfully",
//       data: newResponse,
//     });
//   } catch (error) {
//     console.error("Error saving location response:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };
// }

// module.exports = new FCMController()







const FCMToken = require("../models/FCMToken")
const Employee = require("../models/Employee")
const FCMService = require("../services/FCMService")
const LocationResponse = require("../models/LocationResponse")
class FCMController {
  // Store/update FCM token for employee
  updateFCMToken = async (req, res) => {
    try {
      const { employeeId, token, deviceId, platform } = req.body

      if (!employeeId || !token || !deviceId || !platform) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: employeeId, token, deviceId, platform",
        })
      }

      // Verify employee exists
      const employee = await Employee.findById(employeeId)
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        })
      }

      // Update or create FCM token
      const fcmToken = await FCMToken.findOneAndUpdate(
        { employeeId },
        {
          token,
          deviceId,
          platform,
          isActive: true,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true },
      )

      res.json({
        success: true,
        message: "FCM token updated successfully",
        data: { tokenId: fcmToken._id },
      })
    } catch (error) {
      console.error("Error updating FCM token:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }

  // Admin endpoint to request location via FCM
  requestLocationFCM = async (req, res) => {
    try {
      const { employeeId, adminId } = req.body

      if (!employeeId || !adminId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID and Admin ID are required",
        })
      }

      // Get employee's FCM token
      const fcmToken = await FCMToken.findOne({
        employeeId,
        isActive: true,
      })

      if (!fcmToken) {
        return res.status(404).json({
          success: false,
          message: "Employee FCM token not found or inactive",
        })
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Send FCM location request with requestId
      const result = await FCMService.sendLocationRequest(fcmToken.fcmToken, employeeId, adminId, requestId)

      console.log(result)

      if (result.success) {
        res.json({
          success: true,
          message: "Location request sent via FCM",
          data: { messageId: result.messageId, requestId },
        })
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send FCM location request",
          error: result.error,
        })
      }
    } catch (error) {
      console.error("Error requesting location via FCM:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }

  // Bulk location request for multiple employees
  requestBulkLocationFCM = async (req, res) => {
    try {
      const { employeeIds, adminId } = req.body

      if (!employeeIds || !Array.isArray(employeeIds) || !adminId) {
        return res.status(400).json({
          success: false,
          message: "Employee IDs array and Admin ID are required",
        })
      }

      // Get FCM tokens for all employees
      const fcmTokens = await FCMToken.find({
        employeeId: { $in: employeeIds },
        isActive: true,
      })

      if (fcmTokens.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No active FCM tokens found for specified employees",
        })
      }

      const tokens = fcmTokens.map((fcm) => ({
        token: fcm.token,
        employeeId: fcm.employeeId,
      }))

      // Send bulk FCM location requests
      const result = await FCMService.sendBulkLocationRequests(tokens, adminId)

      res.json({
        success: true,
        message: `Location requests sent to ${tokens.length} employees`,
        data: {
          totalSent: tokens.length,
          results: result.results,
        },
      })
    } catch (error) {
      console.error("Error sending bulk location requests:", error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }

  saveToken = async (req, res) => {
    const { userId, fcmToken } = req.body

    try {
      await Employee.findByIdAndUpdate(userId, { fcmToken }, { new: true })
      res.json({ success: true, message: "FCM token saved" })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
  adminLocationResponse = async (req, res) => {
    try {
      const { employeeId, adminId, requestId, location, timestamp } = req.body

      console.log("Received location response:", { employeeId, adminId, requestId, location, timestamp })

      if (!employeeId || !adminId || !location) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: employeeId, adminId, location",
        })
      }

      // Optional: validate employee exists
      const employee = await Employee.findById(employeeId)

      if (!employee) {
        return res.status(404).json({ success: false, message: "Employee not found" })
      }

      // Save response with fallback requestId if not provided
      const newResponse = new LocationResponse({
        employeeId,
        adminId,
        requestId: requestId || `fallback_${Date.now()}`,
        location,
        timestamp: timestamp || new Date(),
      })

      await newResponse.save()

      console.log("Location response saved successfully:", newResponse)

      return res.status(201).json({
        success: true,
        message: "Location response saved successfully",
        data: newResponse,
      })
    } catch (error) {
      console.error("Error saving location response:", error)
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }
}

module.exports = new FCMController()
