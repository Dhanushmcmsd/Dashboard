import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/uploads.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/uploads", uploadRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/admin", adminRoutes);

app.listen(Number(process.env.PORT || 8080), () => {
  console.log(`API listening on :${process.env.PORT || 8080}`);
});
