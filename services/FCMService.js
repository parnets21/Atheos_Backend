// const admin = require("firebase-admin")
// const serviceAccount = require("../middleware/firebase-service-account.json"); // download from Firebase settings
// class FCMService {
//   constructor() {
//     // Initialize Firebase Admin SDK
//     // if (!admin.apps.length) {
//     //   admin.initializeApp({
//     //     credential: admin.credential.cert({
//     //       projectId: process.env.FIREBASE_PROJECT_ID,
//     //       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     //       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     //     }),
//     //   })
//     // }

//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//     });
//   }




//   // Send FCM message to request location
//   async sendLocationRequest(fcmToken, employeeId, adminId) {
//     try {
//       const message = {
//         token: fcmToken,
//         data: {
//           type: "LOCATION_REQUEST",
//           employeeId: employeeId.toString(),
//           adminId: adminId.toString(),
//           timestamp: Date.now().toString(),
//         },
//         notification: {
//           title: "Location Request",
//           body: "Admin has requested your current location",
//         },
//         android: {
//           priority: "high",
//           notification: {
//             channelId: "location_requests",
//             priority: "high",
//           },
//         },
//         apns: {
//           payload: {
//             aps: {
//               "content-available": 1,
//               priority: 10,
//             },
//           },
//         },
//       }

//       const response = await admin.messaging().send(message)
//       console.log("FCM location request sent:", response)
//       return { success: true, messageId: response }
//     } catch (error) {
//       console.error("Error sending FCM location request:", error)
//       return { success: false, error: error.message }
//     }
//   }

//   // Send bulk location requests to multiple employees
//   async sendBulkLocationRequests(tokens, adminId) {
//     try {
//       const messages = tokens.map(({ token, employeeId }) => ({
//         token,
//         data: {
//           type: "LOCATION_REQUEST",
//           employeeId: employeeId.toString(),
//           adminId: adminId.toString(),
//           timestamp: Date.now().toString(),
//         },
//         notification: {
//           title: "Location Request",
//           body: "Admin has requested your current location",
//         },
//       }))

//       const response = await admin.messaging().sendAll(messages)
//       console.log(`FCM bulk location requests sent: ${response.successCount}/${messages.length}`)
//       return { success: true, results: response }
//     } catch (error) {
//       console.error("Error sending bulk FCM location requests:", error)
//       return { success: false, error: error.message }
//     }
//   }
// }

// module.exports = new FCMService()











const admin = require("firebase-admin")
// const admin = require("firebase-admin")
const serviceAccount = require("../middleware/firebase-service-account.json");
class FCMService {
  constructor() {
    // Initialize Firebase Admin SDK
    // if (!admin.apps.length) {
    //   admin.initializeApp({
    //     credential: admin.credential.cert({
    //       projectId: process.env.FIREBASE_PROJECT_ID,
    //       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    //       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    //     }),
    //   })
    // }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  async sendLocationRequest(fcmToken, employeeId, adminId, requestId) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: "Location Request",
          body: "Admin has requested your current location",
        },
        data: {
          type: "LOCATION_REQUEST",
          employeeId: employeeId.toString(),
          adminId: adminId.toString(),
          requestId: requestId,
          timestamp: Date.now().toString(),
        },
        android: {
          priority: "high",
          notification: {
            channelId: "location_requests",
            priority: "high",
          },
        },
      }

      const response = await admin.messaging().send(message)

      return {
        success: true,
        messageId: response,
      }
    } catch (error) {
      console.error("Error sending FCM location request:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async sendBulkLocationRequests(tokens, adminId) {
    const results = []

    for (const tokenData of tokens) {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const result = await this.sendLocationRequest(tokenData.token, tokenData.employeeId, adminId, requestId)
      results.push({
        employeeId: tokenData.employeeId,
        requestId,
        ...result,
      })
    }

    return { results }
  }
}

module.exports = new FCMService()
