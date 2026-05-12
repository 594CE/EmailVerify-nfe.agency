import { Request, Response } from "express";
import { Team } from "@nfe/database";
import { User } from "@nfe/database";
import { logger } from "@nfe/config";

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const userId = (req as any).user.userId;

    const newTeam = new Team({ name, ownerId: userId, pooledCredits: 0 });
    await newTeam.save();

    await User.findByIdAndUpdate(userId, { teamId: newTeam._id });

    res
      .status(201)
      .json({ message: "Team created successfully", team: newTeam });
  } catch (error) {
    logger.error({ err: error }, "Error creating team");
    res.status(500).json({ message: "Internal server error" });
  }
};

export const inviteMember = async (req: Request, res: Response) => {
  // Logic for inviting members via email, creating a pending invitation etc.
  res.status(200).json({ message: "Invitation sent" });
};

export const getTeam = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await User.findById(userId).populate("teamId");
    if (!user || !user.teamId) {
      return res.status(404).json({ message: "Team not found" });
    }

    // In a real app, we would query members of the team here.
    res.status(200).json({ team: user.teamId });
  } catch (error) {
    logger.error({ err: error }, "Error getting team");
    res.status(500).json({ message: "Internal server error" });
  }
};
