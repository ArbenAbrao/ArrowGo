const express = require("express");
const cors = require("cors");

// Route files
const trucksRoutes = require("./routes/trucks");
const typesRoutes = require("./routes/types");
const visitorRoutes = require("./routes/visitors");
const requestRoutes = require("./routes/requests"); 
const truckRequestRoutes = require("./routes/truckrequest");
const appointmentRequestRoutes = require("./routes/appointmentRequests");
const requestStatsRoutes = require("./routes/requestStats");
const requestAnalyticsRoutes = require("./routes/requestAnalytics");
const accountsRoutes = require("./routes/accounts");
const branchesRoutes = require("./routes/branches"); // ✅ ADD THIS


const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.set("trust proxy", true);
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


// ================= ROUTES =================
app.use("/api", trucksRoutes);
app.use("/api/truck-types", typesRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api", truckRequestRoutes);
app.use("/api/appointment-requests", appointmentRequestRoutes);
app.use("/api/request-stats", requestStatsRoutes);
app.use("/api/requests", requestAnalyticsRoutes); // analytics
app.use("/api", accountsRoutes);
app.use("/api", branchesRoutes); // ✅ THIS WAS MISSING

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.status(200).send("🚚 Truck Management API is running!");
});

// ================= START SERVER =================
app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log("✅ Server successfully started");
  console.log(`👉 Local:   http://localhost:${PORT}`);
  console.log(`👉 Network: http://<your-ip>:${PORT}`);
  console.log("======================================");
});
