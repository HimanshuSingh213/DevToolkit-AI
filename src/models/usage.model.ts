import mongoose, { model, models, Schema, Document, Types } from "mongoose";
import { DAILY_RATE_LIMIT } from "@/lib/constants";

export interface Usage extends Document {
    userId: Types.ObjectId | string,
    dailyUsage: number,
    dailyLimit: number,
    lastReset: Date,
    createdAt: Date,
    updatedAt: Date
}

const usageSchema = new Schema<Usage>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "UserId is required"],
        unique: true
    },
    dailyUsage: {
        type: Number,
        max: DAILY_RATE_LIMIT,
        default: 0
    },
    dailyLimit: {
        type: Number,
        default: DAILY_RATE_LIMIT
    },
    lastReset: {
        type: Date,
        default: () => new Date()
    }
}, { timestamps: true })

const UsageModel = models.Usage as mongoose.Model<Usage> || model<Usage>("Usage", usageSchema);

export default UsageModel;