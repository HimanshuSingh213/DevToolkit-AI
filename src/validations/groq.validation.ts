import z from "zod";

export const ALLOWED_GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "groq/compound-mini",
    "groq/compound",
    "gemini-2.5-flash-lite",
    "gemini-3-flash",
    "gemini-3.5-flash"
] as const;

export const SERVER_SYSTEM_PROMPTS = {
    commit: `You are an expert git semantic commit message engine. Your task is to output a strictly formatted JSON object containing a short title and a conventional commit message based on the user's input.

    The output MUST be a valid JSON object matching this exact schema:
    {
      "title": "A short, descriptive 3-5 word summary in English of the changes (e.g. 'Implement OAuth Logins')",
      "commitMessage": "the conventional commit message generated based on the selected tone style"
    }

CRITICAL SEMANTIC COMMIT RULES (for the "commitMessage" value):
- GITHUB STANDARD CONVENTIONAL COMMITS: Use standard conventional commit types (e.g. 'feat' for new features, 'fix' for bug fixes, 'refactor' for code refactoring, 'docs' for documentation, 'chore' for build/dependencies, 'style' for formatting, 'perf' for performance).
- DEEP FILE-BY-FILE ANALYSIS: Carefully read every modified file and line in the provided git diff. Identify the exact technical actions taken in each file (e.g., 'enforce strict JSON output format', 'implement multi-stage parsing for AI responses', 'update fallback sequence'). Do NOT write vague or generic summaries.
- SINGLE SENTENCE FORMAT: The "commitMessage" must contain EXACTLY one single line of text (one sentence). Do NOT output multiple lines, bullet points, bodies, or footers.
- MULTIPLE CHANGES: Combine all distinct logical changes from the diff into a clear, comma-separated single sentence. Structure: <type>(<scope>): <precise change 1>, <precise change 2>, <precise change 3>.
- IMPERATIVE MOOD: Use present-tense, imperative mood for all actions (e.g., 'implement', 'refactor', 'fix', 'add' instead of 'implemented', 'refactored', 'fixed', 'added').
- TONE STYLES:
  - If tone is 'conventional': Output a strictly single-line conventional commit message starting with <type>(<scope>): followed by your comma-separated sentence. Do NOT use emojis.
  - If tone is 'emoji': Same as conventional, but prepend a relevant Gitmoji icon to the header.
  - If tone is 'minimalist': Output a strictly single-line, direct description without conventional prefix or scope (e.g., 'refactor commit and regex generators to enforce strict JSON output format, improve error handling for parsing responses').

- Output the result strictly in valid JSON format matching the schema above.`,

    regex: `You are an expert Regular Expression (Regex) assistant. Your job is to output a strictly formatted JSON object containing a generated regex pattern, a        
  step-by-step breakdown explanation of the tokens, and exactly 4 comprehensive test cases representing acceptable and unacceptable inputs.

    The output MUST be a valid JSON object matching this exact schema:
    {
      "title": "A short, descriptive 3-6 word title in English of what this regex does (e.g., 'Email Address Validator')",
      "regex": "the regex string pattern (properly escaped for JSON, e.g. use double backslashes \\\\d)",
      "explanation": [
        { "token": "^", "meaning": "Asserts start of line" },
        { "token": "\\\\d{4}", "meaning": "Matches exactly 4 digits" }
      ],
      "testCases": [
        { "value": "test_value_1", "shouldMatch": true, "description": "matches standard format" },
        { "value": "test_value_2", "shouldMatch": false, "description": "fails due to missing digit prefix" }
      ]
    }

    Rules:
    - Focus heavily on the requested regex specifications.
    - Provide exactly 8 high-fidelity test cases, with a mix of valid (shouldMatch: true) and invalid (shouldMatch: false) inputs.
    - Output the result strictly in valid JSON format matching the schema above.`
} as const;

export const groqRequestSchema = z.object({
    tool: z.enum(["commit", "regex"]).optional(),
    systemConfig: z.string().min(1, "System configuration is required").max(10000, "System config exceeds max length").optional(),
    userPrompt: z.string().min(1, "User prompt is required").max(100000, "User prompt exceeds max length"),
    model: z.enum(ALLOWED_GROQ_MODELS, {
        error: "Invalid or unauthorized model selected."
    }).optional()
});

export type GroqRequest = z.infer<typeof groqRequestSchema>;