require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const categoryRoutes = require("./routes/categoryRoutes.js");
const productRoutes = require("./routes/productRoutes.js");
const accPriceRoutes = require("./routes/accpriceRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");
const websiteRoutes = require("./routes/websiteRoutes.js");
const inquiryRoutes = require("./routes/inquiryRoutes.js");

const app = express();
const PORT = Number(process.env.PORT) || 5014;

// ======================================================
// BASIC MIDDLEWARE
// ======================================================

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================================================
// CORS
// ======================================================

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-admin-key",
    ],

    credentials: true,
  })
);

// ======================================================
// STATIC UPLOADS
// ======================================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ======================================================
// ROOT
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MMW Admin API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    environment: process.env.NODE_ENV || "development",
  });
});

// ======================================================
// ADMIN LOGIN
// ======================================================

app.post("/api/admin/login", (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (!adminUsername || !adminPassword) {
      console.error(
        "ADMIN_USERNAME or ADMIN_PASSWORD is missing in .env"
      );

      return res.status(500).json({
        success: false,
        message: "Admin authentication is not configured",
      });
    }

    if (!adminApiKey) {
      console.error("ADMIN_API_KEY is missing in .env");

      return res.status(500).json({
        success: false,
        message: "Admin API key is not configured",
      });
    }

    const usernameMatch = username === adminUsername;
    const passwordMatch = password === adminPassword;

    console.log("Admin login attempt:", {
      usernameReceived: username,
      usernameMatch,
      passwordMatch,
    });

    if (!usernameMatch || !passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      apiKey: adminApiKey,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ======================================================
// ADMIN API KEY MIDDLEWARE
// ======================================================

function adminAuth(req, res, next) {
  const apiKey = req.headers["x-admin-key"];
  const configuredApiKey = process.env.ADMIN_API_KEY;

  if (!configuredApiKey) {
    console.error("ADMIN_API_KEY is missing in .env");

    return res.status(500).json({
      success: false,
      message: "Admin API authentication is not configured",
    });
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "Admin API key is required",
    });
  }

  if (apiKey !== configuredApiKey) {
    return res.status(403).json({
      success: false,
      message: "Invalid admin API key",
    });
  }

  next();
}

// ======================================================
// API ROUTES
// ======================================================

// Admin protected routes

app.use(
  "/categories",
  adminAuth,
  categoryRoutes
);

app.use(
  "/products",
  adminAuth,
  productRoutes
);

app.use(
  "/accprice",
  adminAuth,
  accPriceRoutes
);

app.use(
  "/api/blogs",
  blogRoutes
);

app.use(
  "/api/websites",
  websiteRoutes
);

app.use(
  "/api/inquiries",
  adminAuth,
  inquiryRoutes
);

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS origin not allowed",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ======================================================
// DATABASE + SERVER START
// ======================================================

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing in .env");
    process.exit(1);
  }

  if (!process.env.ADMIN_USERNAME) {
    console.error("ADMIN_USERNAME is missing in .env");
    process.exit(1);
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD is missing in .env");
    process.exit(1);
  }

  if (!process.env.ADMIN_API_KEY) {
    console.error("ADMIN_API_KEY is missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("====================================");
    console.log("Connected to MongoDB");
    console.log(
      "MongoDB database:",
      mongoose.connection.name
    );
    console.log("====================================");

    console.log(
      "CORS origins:",
      allowedOrigins
    );

    console.log(
      "Admin username configured:",
      Boolean(process.env.ADMIN_USERNAME)
    );

    console.log(
      "Admin password configured:",
      Boolean(process.env.ADMIN_PASSWORD)
    );

    console.log(
      "Admin API key configured:",
      Boolean(process.env.ADMIN_API_KEY)
    );

    app.listen(PORT, () => {
      console.log("====================================");
      console.log(
        `Server is running on port ${PORT}`
      );
      console.log(
        `Health: http://localhost:${PORT}/health`
      );
      console.log("====================================");
    });
  } catch (error) {
    console.error(
      "Could not connect to MongoDB:",
      error.message
    );

    process.exit(1);
  }
}

start();
