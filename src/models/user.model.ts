import mongoose, { Schema, models } from "mongoose";

export interface User {
    name: string,
    avatar: string,
    email: string,
    provider: "google" | "github"
    createdAt: Date,
    updatedAt: Date
}

const UserSchema = new Schema<User>({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        unique: true,
        lowercase: true
    },
    provider: {
        type: String,
        enum: ["google", "github"],
        required: true
    },
    avatar: {
        type: String,
        default: ""
    }
}, { timestamps: true })

const UserModel = models.User as mongoose.Model<User> || mongoose.model<User>("User", UserSchema);

export default UserModel;