import { Router } from "express";
import multer from "multer";
import {
  verifySingleEmail,
  verifyBulkUpload,
  getHistory,
  getBulkJobs,
} from "../controllers/verification.controller";
import { authenticateJWT } from "../middlewares/auth";
import { apiRateLimiter } from "../middlewares/rateLimiter";

const router: Router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads/";
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB limit

router.use(authenticateJWT);
router.use(apiRateLimiter);

router.post("/single", verifySingleEmail);
router.post("/bulk", upload.single("file"), verifyBulkUpload);
router.get("/history", getHistory);
router.get("/bulk", getBulkJobs);

export default router;
