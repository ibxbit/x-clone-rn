// src/server.js

import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express"; // <-- REVERTED IMPORT - NO createRouteMatcher HERE!

import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// --- Clerk Middleware with publicRoutes configuration ---
// This is the common way to define public routes directly within the middleware options.
app.use(clerkMiddleware({
  // Define an array of routes that should be publicly accessible
  // These are paths that will NOT require authentication
  publicRoutes: [
    '/',             // Allows access to your root path
    '/favicon.ico',  // Allows access to favicon.ico
    '/favicon.png',  // Allows access to favicon.png
    // You can use wildcards if necessary, e.g., '/api/public/(.*)'
    // Add any other specific API endpoints that should be publicly accessible
    // e.g., '/api/posts/public'
  ],
  // If you want to allow all users (even unauthenticated) to access certain API routes
  // while still running the middleware for context, you might add them here too.
  // ignoreRoutes: ['/api/some-public-endpoint'], // Another option, but publicRoutes is usually preferred for entire paths
}));

// IMPORTANT: Ensure arcjetMiddleware is compatible or configured correctly
// if it's also blocking.
app.use(arcjetMiddleware);


// --- Connect to DB immediately (for Vercel deployment) ---
connectDB();

// Basic route to confirm server is running and accessible
app.get("/", (req, res) => {
  res.status(200).send("Hello from server. API is running!");
});

// Favicon.ico route (explicitly handled)
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// Favicon.png route
app.get("/favicon.png", (req, res) => {
  res.status(204).end();
});


// API Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || "Internal server error" });
});

// Local Development Listen (Conditional)
if (ENV.NODE_ENV !== "production") {
  app.listen(ENV.PORT, () => console.log("Server is up and running on PORT:", ENV.PORT));
}

// EXPORT THE APP FOR VERCEL
export default app;