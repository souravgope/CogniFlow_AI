import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development")
  },
  server: {
    port: 5173,
    proxy: {
      "/generate-diagram": "http://localhost:5001",
      "/generate-docs": "http://localhost:5001",
      "/generate-explanation": "http://localhost:5001",
      "/generate-learning-path": "http://localhost:5001",
      "/analyze-mistake": "http://localhost:5001",
      "/api": "http://localhost:5001"
    }
  }
});
