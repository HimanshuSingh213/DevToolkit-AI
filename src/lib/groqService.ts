import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROK_API_KEY
});

export const GenerateGrokOutput = async (
    systemConfig: string,
    userPrompt: string,
    model: string = "llama-3.1-8b-instant"
) => {
    try {
        const aiOutput = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemConfig },
                { role: "user", content: userPrompt }
            ],
            model: model,
            temperature: 0.4
        })

        return aiOutput.choices[0]?.message?.content || "";
    } catch (err: any) {
        console.error(`Groq API Error on model ${model}:`, err);

        if (model === "llama-3.3-70b-versatile" && (err?.status === 429 || err?.message?.includes("429"))) {
            console.log("[Groq Pipeline] 70B rate limit hit. Falling back to Llama 3.1 8B...");
            try {
                const fallbackOutput = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemConfig },
                        { role: "user", content: userPrompt }
                    ],
                    model: "llama-3.1-8b-instant",
                    temperature: 0.4
                });
                return fallbackOutput.choices[0]?.message?.content || "";
            } catch (fallbackErr: any) {
                console.error("Groq API Fallback Error:", fallbackErr);
                throw new Error(fallbackErr.message || "Failed to generate AI response");
            }
        }

        throw new Error(err.message || 'Failed to generate AI response');
    }
}
