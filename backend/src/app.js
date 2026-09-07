const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");

const app = express();

const allowedOrigins = (
  process.env.CLIENT_URLS ||
  "http://127.0.0.1:5500,http://localhost:5500"
)
  .split(",")
  .map((origin) => origin.trim());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("This origin is not allowed by CORS."));
    }
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

app.get("/api/health", (request, response) => {
  response.status(200).json({
    success: true,
    message: "HomeStride API is running."
  });
});

app.use("/api/services", serviceRoutes);

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: "The requested API route was not found."
  });
});

app.use((error, request, response, next) => {
  console.error(error);

  response.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});


module.exports = app;