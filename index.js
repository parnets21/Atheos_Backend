const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger.config");
require("dotenv").config();
const http = require("http");
// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
// const projectRoutes = require("./routes/project.routes");
const workerRoutes = require("./routes/worker.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const Hub = require('./routes/Hub')
const Designation = require('./routes/Designation')
const Store = require('./routes/Store')
// const StoreEm = require('./routes/StoreEm')
const Employee = require('./routes/Employee')
const WorkOrder = require('./routes/Workorder')
const Complaint = require('./routes/Complaint')
const socketIo = require('socket.io');
const AttendanceManager = require('./routes/attendanceManager.routes') 
const locationRoutes = require('./routes/locationRoutes')
const fcm  = require('./routes/fcm')
const Client = require("./routes/Client")
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  path: '/socket.io',
  cors: {
    origin: [
      'https://atheos-backend-utsi.onrender.com', // Your frontend URL
      'http://localhost:5173'            // For local development
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Store connected admins and their watched employees
const adminConnections = new Map(); // { socketId: { adminId, watchedEmployees: [employeeIds] } }


io.on("connection", (socket) => {
   console.log(`New connection: ${socket.id}`);
  
  socket.on("error", (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });

  socket.on("admin_connected", (data) => {
    const { adminId, watchedEmployees } = data;
    adminConnections.set(socket.id, { adminId, watchedEmployees });
    console.log(`Admin ${adminId} connected, watching employees:`, watchedEmployees);

    // Send initial employee data to admin
    mongoose.model("Attendance").find(
      { 
        employeeId: { $in: watchedEmployees },
        checkOut: null,
        lastLocationUpdate: { $exists: true }
      },
      { employeeId: 1, currentLocation: 1, lastLocationUpdate: 1 }
    ).then((attendances) => {
      const initialLocations = attendances.map((att) => ({
        employeeId: att.employeeId.toString(),
        latitude: att.currentLocation ? parseFloat(att.currentLocation.split(",")[0]) : null,
        longitude: att.currentLocation ? parseFloat(att.currentLocation.split(",")[1]) : null,
        timestamp: att.lastLocationUpdate,
      })).filter(loc => loc.latitude && loc.longitude);
      socket.emit("initial_locations", initialLocations);
    }).catch((error) => {
      console.error("Error fetching initial locations:", error);
    });
  });

  socket.on("employee_location_update", async (data) => {
    try {
      const { employeeId, latitude, longitude } = data;
      if (!employeeId || latitude == null || longitude == null) {
        throw new Error("Invalid location data");
      }
      await mongoose.model("Attendance").updateOne(
        { employeeId, checkOut: null },
        {
          $set: {
            currentLocation: `${latitude},${longitude}`,
            lastLocationUpdate: new Date(),
          },
        }
      );
      adminConnections.forEach((adminData, adminSocketId) => {
        if (adminData.watchedEmployees.includes(employeeId)) {
          io.to(adminSocketId).emit("location_update", {
            employeeId,
            latitude,
            longitude,
            timestamp: new Date(),
          });
        }
      });
    } catch (error) {
      console.error("Error handling location update:", error);
    }
  });

  socket.on("disconnect", () => {
    adminConnections.delete(socket.id);
    console.log("Client disconnected:", socket.id);
  });
});


// Middleware
app.use(
  cors()
);
app.use(cors());
app.use(morgan("dev"));
// app.use("/Store",express.static("./Public/Store"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require("path");
const Attendance = require("./models/Attendance");
const LocationTrackingController = require("./controller/LocationTrackingController");
app.use(express.static(path.join(__dirname, "Public")));
 

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
// app.use("/api/projects", projectRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin",Hub);
app.use("/api/admin/",Designation);
app.use("/api/admin",Store);
// app.use("/api/admin",StoreEm);
app.use("/api/admin",Employee)
app.use("/api/Workorder",WorkOrder)
app.use("/api/Complaint" ,Complaint)
app.use("/api/admin",Client)
app.use("/api/attendance-manager",AttendanceManager)
app.use("/api/location-tracking",AttendanceManager)
app.use("/api/fcm",fcm)
// app.use("/api/admin");


// Basic route for testing
app.use(express.static(path.join(__dirname, 'build'))); // Change 'build' to your frontend folder if needed

// Global error handler for API routes - must be before the catch-all
app.use('/api', (err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Redirect all non-API requests to the index.html file
app.get("*", (req, res) => {
  // Don't serve HTML for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ 
      success: false, 
      message: 'API endpoint not found' 
    });
  }
  return res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Improved MongoDB connection
const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGODB_URI); // Removed deprecated options
    console.log("MongoDB Connected Successfully");

    // Start server only after DB connection
    const PORT = 5001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // console.log(
      //   `Swagger documentation available at http://localhost:${f}/api-docs`
      // );
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    // Exit process with failure
    process.exit(1);  
  }
};

// Connect to database
connectDB();
