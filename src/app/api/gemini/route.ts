import { NextResponse } from 'next/server'
import { generateReadmePipeline } from '@/lib/geminiService'
import { ApiResponse } from '@/types/ApiResponse'

export async function POST(req: Request) {
  try {
    const { systemPrompt, userPrompt } = await req.json()
    
    if (!userPrompt) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "Prompt content is required"
      }, { status: 400 })
    }

    const result = await generateReadmePipeline(systemPrompt || "", userPrompt)

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
