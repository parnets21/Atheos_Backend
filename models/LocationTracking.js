const mongoose = require("mongoose");

const LocationTrackingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
    },
    locations: [
      {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        distanceFromPrevious: {
          type: Number, // in meters
          default: 0,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLocationUpdate: {
      type: Date,
      default: Date.now,
    },
    totalDistanceTraveled: {
      type: Number, // in meters
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
LocationTrackingSchema.index({ employeeId: 1, attendanceId: 1 });
LocationTrackingSchema.index({ isActive: 1 });

module.exports = mongoose.model("LocationTracking", LocationTrackingSchema);
