import express from "express";
import authRoutes from "./auth-routes.js";
import pageRoutes from "./page-routes'.js";

const router = express.Router();
router.use("/", authRoutes);
router.use("/", pageRoutes);

export default router;
