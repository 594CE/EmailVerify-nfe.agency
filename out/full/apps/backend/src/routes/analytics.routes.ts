import { Router } from "express";
import { getAnalytics } from "../controllers/analytics.controller";
import { authenticateJWT } from "../middlewares/auth";

const router: Router = Router();

router.use(authenticateJWT);
router.get("/", getAnalytics);

export default router;
