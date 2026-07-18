import mongoose, {Schema, models} from "mongoose";

export interface History{
    userId: mongoose.Types.ObjectId,
    tool: "readme" | "commit" | "regex" | "json",
    title: string,
    output: unknown,
    createdAt: Date,
    updatedAt: Date
}

const HistorySchema = new Schema<History>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    tool: {
        type: String,
        enum: ["readme", "commit", "regex", "json"],
        required: [true, "Tool name is required"]
    },
    title: {
        type: String,
        required: [true, "Title is Required"],
        trim: true
    },
    output: {
        type: Schema.Types.Mixed
    }
    
}, {timestamps: true})

const HistoryModel = models.History as mongoose.Model<History> || mongoose.model<History>("History", HistorySchema);

export default HistoryModel;