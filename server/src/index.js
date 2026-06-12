import dotenv from "dotenv";
import mongoose from "mongoose";
import { createApp } from "./app.js";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-whiteboard";

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("💾 MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

const port = process.env.PORT || 5001;
const app = createApp();

const server = app.listen(port, () => {
  console.log(`AI whiteboard server listening on http://localhost:${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${port} is already in use.`);
    console.error(`   Run this command to free it, then restart:\n`);
    console.error(`   Windows:  netstat -ano | findstr :${port}  → then: taskkill /PID <number> /F`);
    console.error(`   Or just:  npx kill-port ${port}\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
