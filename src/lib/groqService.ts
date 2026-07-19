import Groq from "groq-sdk";
import { generateGeminiFallback } from "./geminiService";

const groq = new Groq({
    apiKey: process.env.GROK_API_KEY,
    maxRetries: 0
});

const getFallbackSequence = (): string[] => {
    const chainStr = process.env.GROK_MODEL_FALLBACK_CHAIN;
    if (chainStr) {
        return chainStr.split(",").map(m => m.trim()).filter(Boolean);
    }
    return [
        "llama-3.1-8b-instant",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "groq/compound-mini",
        "groq/compound",
        "llama-3.3-70b-versatile"
    ];
};

export const GenerateGrokOutput = async (
    systemConfig: string,
    userPrompt: string,
    model?: string
) => {
    const fallbackSequence = getFallbackSequence();
    const priorityModel0 = fallbackSequence[0] || "llama-3.1-8b-instant";
    const priorityModel1 = fallbackSequence[1] || "groq/compound-mini";

    const initialModel = model || (userPrompt.length < 20000 ? priorityModel0 : priorityModel1);
    const queue = [initialModel, ...fallbackSequence.filter(m => m !== initialModel)];
    let lastError: any = null;

    for (const currentModel of queue) {
        try {
            console.log(`[Groq Service] Attempting request with model: ${currentModel}`);
            const aiOutput = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemConfig },
                    { role: "user", content: userPrompt }
                ],
                model: currentModel,
                temperature: 0.4
            });

            return {
                text: aiOutput.choices[0]?.message?.content || "",
                modelUsed: currentModel
            };
        } catch (err: any) {
            console.error(`[Groq Service] Error on model ${currentModel}:`, err.message || err);
            lastError = err;

            const isAbort = err?.name === "AbortError" || err?.message?.includes("aborted") || err?.message?.toLowerCase().includes("abort");
            const isAuth = err?.status === 401 || err?.message?.includes("401") || err?.message?.toLowerCase().includes("unauthorized") || err?.message?.toLowerCase().includes("api key");
            
            if (isAbort || isAuth) {
                throw err;
            }

            const isRateLimit = err?.status === 429 || err?.statusCode === 429 || err?.message?.includes("429") || err?.message?.toLowerCase().includes("rate limit");
            if (isRateLimit) {
                const retryAfterSeconds = parseFloat(err.headers?.['retry-after'] || '2');
                console.warn(`[Groq Service] Model ${currentModel} rate limited. Waiting ${retryAfterSeconds}s before switching...`);
                await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
            }

            console.warn(`[Groq Service] Error on ${currentModel} (retrying next model in chain): ${err.message || err}`);
        }
    }

    try {
        console.log(`[Groq Service] All Groq fallback models failed. Routing to Gemini fallback queue...`);
        const geminiResult = await generateGeminiFallback(systemConfig, userPrompt);
        console.log(`[Groq Service] Gemini fallback succeeded with model: ${geminiResult.modelUsed}`);
        return geminiResult;
    } catch (fallbackErr: any) {
        console.error(`[Groq Service] Gemini fallback failed:`, fallbackErr.message || fallbackErr);
        throw new Error(lastError?.message || 'Failed to generate AI response across all models');
    }
};
