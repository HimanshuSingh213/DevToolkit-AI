import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import UsageModel from "@/models/usage.model";
import { NextResponse } from "next/server";
import { DAILY_RATE_LIMIT } from "@/lib/constants";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        
        const now = new Date();
        const usage = await UsageModel.findOneAndUpdate(
            { userId: session.user.id },
            {
                $setOnInsert: {
                    dailyUsage: 0,
                    dailyLimit: DAILY_RATE_LIMIT,
                    lastReset: now
                }
            },
            { upsert: true, new: true }
        );

        if (!usage) {
            return NextResponse.json({ success: false, error: "Failed to load usage record" }, { status: 500 });
        }

        let changed = false;
        
        // Daily reset check
        const lastResetDate = new Date(usage.lastReset);
        if (now.toDateString() !== lastResetDate.toDateString()) {
            usage.dailyUsage = 0;
            usage.lastReset = now;
            changed = true;
        }
        
        if (changed) {
            await usage.save();
        }

        return NextResponse.json({
            success: true,
            data: {
                dailyUsage: usage.dailyUsage,
                dailyLimit: usage.dailyLimit
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
