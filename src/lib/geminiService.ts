import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_QUEUE = [
    { id: "gemma-4-31b", label: "Gemma 4 31B (High Accuracy)", speed: "stable" },
    { id: "gemma-4-26b-a4b-it", label: "Gemma 4 26B (Standard Mode)", speed: "balanced" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Turbo Speed)", speed: "fast" }
];

export const generateReadmePipeline = async (
    systemPrompt: string, userPrompt: string
) => {
    let lastError: any = null;

    for (const model of MODEL_QUEUE) {
        try {
            const response = await ai.models.generateContent({
                model: model.id,
                contents: userPrompt, // real user prompt
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.2,
                    responseMimeType: "application/json"  // forcing model to return json only
                }
            });

            return {
                text: response.text,
                engineLabel: model.label,
                engineSpeed: model.speed
            }
        } catch (err: any) {
            lastError = err;

            // Checking for rate limits (HTTP 429) or quota errors
            const isRateLimit = err?.status === 429 || err?.message?.toLowerCase().includes("quota") || err?.message?.includes("429");

            if (isRateLimit) {
                continue; // Trying the next model
            }

            // Fail immediately for structural errs
            throw err;
        }

    }

    throw new Error(`All system engines are over capacity. Error: ${lastError?.message}`);
}