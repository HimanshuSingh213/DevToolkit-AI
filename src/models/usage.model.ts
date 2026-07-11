import mongoose, { model, models, ObjectId, Schema } from "mongoose";

export interface Usage {
    userId: ObjectId,
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
        max: 100,
        default: 0
    },
    dailyLimit: {
        type: Number,
        default: 100
    },
    lastReset: {
        type: Date,
        default: () => new Date()
    }
}, { timestamps: true })

const UsageModel = models.Usage as mongoose.Model<Usage> || model<Usage>("Usage", usageSchema);

export default UsageModel;