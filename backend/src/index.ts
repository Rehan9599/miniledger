import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Load environment variables FIRST — before importing anything that uses them
dotenv.config();

import authRoutes from "./routes/auth";
import loanRoutes from "./routes/loans";
import summaryRoutes from "./routes/summary";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded receipt images as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/summary", summaryRoutes);

// Health check endpoint
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "MiniLedger API",
        timestamp: new Date().toISOString(),
    });
});

// Start server (only if not running in test environment)
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`\n MiniLedger API running on http://localhost:${PORT}`);
        console.log(` Health check: http://localhost:${PORT}/api/health\n`);
    });
}

export default app;