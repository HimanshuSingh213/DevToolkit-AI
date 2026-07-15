import { NextResponse } from 'next/server'
import { generateReadmeFromGithub, generateReadmeFromManual } from '@/lib/geminiService'
import { readmeRequestSchema } from '@/validations/readme.validation'
import { ApiResponse } from '@/types/ApiResponse'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Zod input validation check
    const validationResult = readmeRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.issues[0].message
      }, { status: 400 })
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
      data: result
    })
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: err.message || "Failed to generate README"
    }, { status: 500 })
  }
}
