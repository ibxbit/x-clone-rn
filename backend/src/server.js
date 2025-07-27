// src/server.js

import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { ENV } from "./config/env.js"; // Make sure ENV.PORT is defined for local dev
import { connectDB } from "./config/db.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Apply clerk and arcjet middleware
// Make sure clerkMiddleware() is properly configured for your Clerk instance
// and that arcjetMiddleware is set up to allow requests.
app.use(clerkMiddleware());
app.use(arcjetMiddleware);

// --- Connect to DB immediately (for Vercel deployment) ---
// This ensures the DB connection is established when the serverless function cold starts
connectDB(); // Call connectDB directly here

// Basic route to confirm server is running and accessible
app.get("/", (req, res) => {
  res.status(200).send("Hello from server");
});

// Favicon.ico route (optional, but good to prevent 403s if requested)
app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // 204 No Content
});
app.get("/favicon.png", (req, res) => {
  res.status(204).end(); // 204 No Content for favicon.png
});


// API Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware (should be the last `app.use`)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  // Ensure a proper status code is sent, not just 500 always.
  // Example: if err.statusCode exists, use that, otherwise default to 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || "Internal server error" });
});

// --- Local Development Listen (Conditional) ---
// This part is ONLY for running your server locally with 'node src/server.js'
if (ENV.NODE_ENV !== "production") {
  app.listen(ENV.PORT, () => console.log("Server is up and running on PORT:", ENV.PORT));
}

// --- EXPORT THE APP FOR VERCEL ---
// Vercel expects the 'app' instance to be exported directly.
// It will handle starting the server based on this export.
export default app;