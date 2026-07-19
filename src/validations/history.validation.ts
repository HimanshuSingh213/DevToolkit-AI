import z from "zod";

export const historySchema = z.object({
    tool: z.enum(["readme", "commit", "regex", "json"]),
    title: z.string().min(1).max(500),
    output: z.any().optional()
});