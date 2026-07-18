import { GenerateGrokOutput } from "@/lib/groqService";
import { ApiResponse } from "@/types/ApiResponse";
import { groqRequestSchema } from "@/validations/groq.validation";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAndIncrementUsage } from "@/lib/rateLimiter";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: "Unauthorized access. Please login first."
            }, { status: 401 });
        }

        const body = await req.json();

        const validation = groqRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message || "Please enter valid input"
            }, { status: 400 });
        }

        // Rate Limit check
        let limitStatus;
        try {
            limitStatus = await checkAndIncrementUsage(session.user.id);
        } catch (limitErr: any) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: limitErr.message || "Rate limit reached."
            }, { status: 429 });
        }

        const requestData = validation.data;
        
        const responseData = await GenerateGrokOutput(
            requestData.systemConfig,
            requestData.userPrompt,
            requestData.model
        );

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                result: responseData,
                usage: limitStatus
            }
        });
    } catch (err: any) {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: err.message || "Failed to process request"
        }, { status: 500 });
    }
}