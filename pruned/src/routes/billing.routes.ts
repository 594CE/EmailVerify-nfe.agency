import { Router } from "express";
import express from "express";
import {
  createCheckoutSession,
  stripeWebhook,
} from "../controllers/billing.controller";
import { authenticateJWT } from "../middlewares/auth";

const router: Router = Router();

router.post("/create-checkout-session", authenticateJWT, createCheckoutSession);

// Webhook requires raw body for signature verification
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

export default router;
