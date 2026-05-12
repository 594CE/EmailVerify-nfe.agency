import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: "user" | "admin";
  credits: number;
  isEmailVerified: boolean;
  stripeCustomerId?: string;
  subscriptionPlan: "free" | "starter" | "growth" | "agency";
  teamId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    credits: { type: Number, default: 100 },
    isEmailVerified: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "growth", "agency"],
      default: "free",
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);
