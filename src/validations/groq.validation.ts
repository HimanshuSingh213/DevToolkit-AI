import z from "zod";

export const groqRequestSchema = z.object({
    systemConfig: z.string().min(1, "System configuration is required").max(10000, "System config exceeds max length"),
    userPrompt: z.string().min(1, "User prompt is required").max(100000, "User prompt exceeds max length"),
    model: z.string().optional()
});

export type GroqRequest = z.infer<typeof groqRequestSchema>;