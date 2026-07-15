import { GenerateGrokOutput } from "@/lib/groqService";
import { ApiResponse } from "@/types/ApiResponse";
import { groqRequestSchema } from "@/validations/others.validation";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const validation = groqRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message || "Please enter valid input"
            }, { status: 400 });
        }

        const requestData = validation.data;
        
        const responseData = await GenerateGrokOutput(
            requestData.systemConfig,
            requestData.userPrompt,
            requestData.model
        );

        return NextResponse.json<ApiResponse>({
            success: true,
            data: responseData
        });
    } catch (err: any) {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: err.message || "Failed to process request"
        }, { status: 500 });
    }
}