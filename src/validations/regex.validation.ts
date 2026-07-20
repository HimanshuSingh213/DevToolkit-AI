import z from "zod";

export const regexRequestSchema = z.object({
    matchInput: z.string().min(5, "Please describe match specifications (at least 5 characters long)").max(10000, "Match input exceeds max length")
});

export type RegexResponse = z.infer<typeof regexRequestSchema>;