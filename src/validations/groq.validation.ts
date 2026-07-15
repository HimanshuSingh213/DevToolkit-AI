import z from "zod";

export const groqRequestSchema = z.object({
    systemConfig: z.string().min(1, "System configuration is required"),
    userPrompt: z.string().min(1, "User prompt is required"),
    model: z.string().optional()
});

export type GroqRequest = z.infer<typeof groqRequestSchema>;