import z from "zod";

export const historySchema = z.object({
    tool: z.enum(["readme", "commit", "regex", "json"]),
    title: z.string().min(5).max(200),
    output: z.any().optional()
});