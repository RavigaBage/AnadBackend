import "dotenv/config";
import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import {apiLimiter} from '../src/middleware/ratelimiter.js'
import authRoutes from "./routes/auth.routes.js";
import PagesRoutes from "./routes/pages.route.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors({
   origin: "http://localhost:5173",
   credentials: true 
  }));
app.use(express.json());
app.use("/api",apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/pages", PagesRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "OK", database: "Connected" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});