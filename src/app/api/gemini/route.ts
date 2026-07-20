import { NextResponse } from 'next/server'
import { generateReadmeFromGithub, generateReadmeFromManual } from '@/lib/geminiService'
import { readmeRequestSchema } from '@/validations/readme.validation'
import { ApiResponse } from '@/types/ApiResponse'
import { auth } from '@/auth'
import { checkAndIncrementUsage } from '@/lib/rateLimiter'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "Unauthorized access. Please login first."
      }, { status: 401 })
    }

    const body = await req.json()
    
    // Zod input validation check
    const validationResult = readmeRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.issues[0].message
      }, { status: 400 })
    }

    // Rate Limit check
    let limitStatus;
    try {
      limitStatus = await checkAndIncrementUsage(session.user.id)
    } catch (limitErr: any) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: limitErr.message || "Rate limit reached."
      }, { status: 429 })
    }

    const validatedData = validationResult.data
    let result;

    // Branch execution according to mode
    if (validatedData.mode === 'github') {
      result = await generateReadmeFromGithub(validatedData.githubUrl, validatedData.customInstructions)
    } else {
      result = await generateReadmeFromManual(validatedData.manualData, validatedData.customInstructions)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "README generated successfully",
      data: {
        ...result,
        usage: limitStatus
      }
    })
  } catch (err: any) {
    console.error("[Gemini API Error]:", err);
    const msg = err.message || "";
    const isPublic = msg.toLowerCase().includes("private") || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("limit");
    return NextResponse.json<ApiResponse>({
      success: false,
      error: isPublic ? msg : "Failed to generate README. Please try again."
    }, { status: 500 })
  }
}
