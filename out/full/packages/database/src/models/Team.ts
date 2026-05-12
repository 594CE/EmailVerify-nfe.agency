import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  pooledCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pooledCredits: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Team = mongoose.model<ITeam>("Team", TeamSchema);
