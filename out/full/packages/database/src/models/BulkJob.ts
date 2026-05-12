import mongoose, { Schema, Document } from "mongoose";

export interface IBulkJob extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  totalEmails: number;
  processedEmails: number;
  status: "pending" | "processing" | "completed" | "failed";
  resultsUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BulkJobSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    totalEmails: { type: Number, required: true, default: 0 },
    processedEmails: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    resultsUrl: { type: String },
  },
  { timestamps: true },
);

export const BulkJob = mongoose.model<IBulkJob>("BulkJob", BulkJobSchema);
