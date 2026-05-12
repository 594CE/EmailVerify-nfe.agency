import mongoose, { Schema, Document } from "mongoose";

export interface IVerificationLog extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  status:
    | "valid"
    | "invalid"
    | "risky"
    | "catch-all"
    | "disposable"
    | "unknown";
  score: number;
  provider: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

const VerificationLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["valid", "invalid", "risky", "catch-all", "disposable", "unknown"],
    },
    score: { type: Number, required: true },
    provider: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { updatedAt: false } },
);

export const VerificationLog = mongoose.model<IVerificationLog>(
  "VerificationLog",
  VerificationLogSchema,
);
