import { z } from 'zod'

export const readmeSchema = z.object({
    systemPrompt: z.string().optional(),
    userPrompt: z.string().min(5, 'Prompt content is required')
})
