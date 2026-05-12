import { Router } from "express";
import {
  createTeam,
  inviteMember,
  getTeam,
} from "../controllers/team.controller";
import { authenticateJWT } from "../middlewares/auth";

const router: Router = Router();

router.use(authenticateJWT);
router.post("/", createTeam);
router.post("/invite", inviteMember);
router.get("/", getTeam);

export default router;
