import mongoose, {Schema, models} from "mongoose";

export interface History{
    userId: mongoose.Types.ObjectId,
    tool: "readme" | "commit" | "code-explainer" | "regex" | "json",
    title: string,
    input: unknown,
    output: unknown,
    description: string,
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
        enum: ["readme", "commit", "code-explainer", "regex", "json"],
        required: [true, "Tool name is required"]
    },
    title: {
        type: String,
        required: [true, "Title is Required"],
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    input: {
        type: Schema.Types.Mixed
    },
    output: {
        type: Schema.Types.Mixed
    }
    
}, {timestamps: true})

const HistoryModel = models.History as mongoose.Model<History> || mongoose.model<History>("History", HistorySchema);

export default HistoryModel;