const mongoose = require("mongoose");

const locationResponseSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestId: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String }, // optional: if you resolve geocoding
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LocationResponse", locationResponseSchema);
