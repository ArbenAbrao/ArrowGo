const express = require("express");
const cors = require("cors");

// Route files
const trucksRoutes = require("./routes/trucks");
const typesRoutes = require("./routes/types");
const visitorRoutes = require("./routes/visitors");
const requestRoutes = require("./routes/requests"); // ✅ NEW

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/api", trucksRoutes);
app.use("/api/truck-types", typesRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/requests", requestRoutes); // ✅ NEW

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