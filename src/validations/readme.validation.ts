import { z } from 'zod';

export const readmeRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('github'),
    githubUrl: z.string().url('Invalid URL format').refine(
      (val) => val.includes('github.com'),
      'URL must be a valid GitHub repository link'
    ),
    customInstructions: z.string().optional()
  }),
  z.object({
    mode: z.literal('manual'),
    manualData: z.string().min(10, 'Manual scope details must be at least 10 characters long'),
    customInstructions: z.string().optional()
  })
]);

export const readmeResponseSchema = z.object({
  readme: z.string().min(10, 'Generated README output cannot be empty'),
  repoName: z.string().optional()
});

export type ReadmeRequest = z.infer<typeof readmeRequestSchema>;
export type ReadmeResponse = z.infer<typeof readmeResponseSchema>;
