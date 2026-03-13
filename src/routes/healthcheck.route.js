import { Router } from "express";
const router = Router();
import healthCheckController from "../controllers/healthCheck.controller.js";

router.route("/").get(healthCheckController);

export default router;
