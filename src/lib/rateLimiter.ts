import dbConnect from "./dbConnect";
import UsageModel from "@/models/usage.model";
import { DAILY_RATE_LIMIT } from "./constants";

export async function checkAndIncrementUsage(userId: string) {
    await dbConnect();

    const now = new Date();
    const usage = await UsageModel.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: {
                dailyUsage: 0,
                dailyLimit: DAILY_RATE_LIMIT,
                lastReset: now
            }
        },
        { upsert: true, returnDocument: "after" }
    );

    if (!usage) {
        throw new Error("Failed to load or initialize usage record.");
    }

    // Daily reset check
    const lastResetDate = new Date(usage.lastReset);
    if (now.toDateString() !== lastResetDate.toDateString()) {
        usage.dailyUsage = 0;
        usage.lastReset = now;
    }

    // Check rate limit boundaries
    if (usage.dailyUsage >= DAILY_RATE_LIMIT) {
        throw new Error(`Daily request limit reached (${DAILY_RATE_LIMIT} requests/day). Please try again tomorrow.`);
    }

    // Increment usage
    usage.dailyUsage += 1;
    await usage.save();

    return {
        dailyUsage: usage.dailyUsage,
        dailyLimit: usage.dailyLimit
    };
}
