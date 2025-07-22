// server.js
import express from 'express';
import { ENV } from './config/env.js'; // Changed to uppercase ENV
import { connectDB } from './config/db.js';

const app = express();

connectDB(); // Ensure you call the function to connect to the DB

app.get("/", (req, res) => res.send("Hello from server!"));

app.listen(ENV.PORT, () => // Changed to uppercase ENV
  console.log("Server is up and running on on PORT:", ENV.PORT)); // Changed to uppercase ENV