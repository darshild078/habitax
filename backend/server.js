const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes    = require("./routes/authRoutes");
const habitRoutes   = require("./routes/habitRoutes");
const logRoutes     = require("./routes/logRoutes");
const plantRoutes   = require("./routes/plantRoutes");
const friendRoutes  = require("./routes/friendRoutes");
const groupRoutes   = require("./routes/groupRoutes");
const socialRoutes  = require("./routes/socialRoutes");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/api/auth",    authRoutes);
app.use("/api/habits",  habitRoutes);
app.use("/api/logs",    logRoutes);
app.use("/api/plants",  plantRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups",  groupRoutes);
app.use("/api/social",  socialRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));