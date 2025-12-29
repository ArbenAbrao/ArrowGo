const express = require("express");
const cors = require("cors");
const trucksRoutes = require("./routes/trucks");
const typesRoutes = require("./routes/types");
const visitorRoutes = require("./routes/visitors");


const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", trucksRoutes);        // /api/register-truck, /api/trucks, etc.
app.use("/api/truck-types", typesRoutes); // /api/truck-types
app.use("/api/visitors", visitorRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("Truck management API is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
  