import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import formRoutes from "./routes/form.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log("MongoDB URI:", MONGO_URI);
console.log("Port:", PORT);

const allowedOrigins = [
  "http://localhost:5173",
  "https://login-auth-form-iqz3.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API is running" });
});

app.get("/health", (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "✅ Connected" : "❌ Disconnected";
  res.json({
    status: "API Healthy",
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
    port: PORT
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Error details:", err);
    process.exit(1);
  });
