import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROK_API_KEY
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

            console.warn(`[Groq Service] Error on ${currentModel} (retrying next model in chain): ${err.message || err}`);
        }
    }

    throw new Error(lastError?.message || 'Failed to generate AI response across all models');
};
