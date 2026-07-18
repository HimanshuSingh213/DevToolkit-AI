import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import HistoryModel from "@/models/history.model";
import { ApiResponse } from "@/types/ApiResponse";
import { historySchema } from "@/validations/history.validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: "Unauthorized access"
            }, { status: 401 });
        }

        const body = await req.json();
        const validation = historySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: "Invalid history inputs"
            }, { status: 400 });
        }

        await dbConnect();
        await HistoryModel.create({
            ...validation.data,
            userId: session.user.id
        });

        return NextResponse.json<ApiResponse>({
            success: true,
            message: "History entry created successfully"
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: err.message || "Failed to create history entry"
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: "Unauthorized access"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const skip = (page - 1) * limit;

        await dbConnect();
        const history = await HistoryModel.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await HistoryModel.countDocuments({ userId: session.user.id });
        const hasMore = totalCount > page * limit;

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                history,
                hasMore
            }
        });
    } catch (err: any) {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: err.message || "Failed to fetch history entries"
        }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: "Unauthorized access"
            }, { status: 401 });
        }

        await dbConnect();
        await HistoryModel.deleteMany({ userId: session.user.id });

        return NextResponse.json<ApiResponse>({
            success: true,
            message: "History cleared successfully"
        });
    } catch (err: any) {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: err.message || "Failed to clear history"
        }, { status: 500 });
    }
}