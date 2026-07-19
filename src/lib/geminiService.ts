import { GoogleGenAI } from "@google/genai";
import getAPIkey, { totalKeysCount } from "./constants";
import axios from "axios";

interface RepoFile {
    path: string;
    type: "blob" | "tree";
}

// Unnecessary files and folders filter lists
const IGNORED_DIRECTORIES = [
    'node_modules/', '.git/', 'dist/', 'build/', 'out/', 'target/',
    '.next/', 'bin/', 'obj/', 'vendor/', 'tmp/', 'coverage/',
    '.idea/', '.vscode/', 'public/'
];

const IGNORED_FILES = [
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'cargo.lock',
    'gemfile.lock', 'composer.lock', 'pnpm-workspace.yaml'
];

const IGNORED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.zip',
    '.tar.gz', '.mp3', '.mp4', '.wav', '.mov', '.db', '.sqlite'
];

const IMPORTANT_FILES = [
    'package.json', 'requirements.txt', 'go.mod', 'cargo.toml',
    'tsconfig.json', 'next.config.js', 'next.config.mjs',
    'tailwind.config.js', 'vite.config.ts', '.env.example'
];

// Helper to check if a file path matches ignored lists
const isIgnoredFile = (path: string): boolean => {
    const lowercasePath = path.toLowerCase();

    // Checking directory list
    for (let i = 0; i < IGNORED_DIRECTORIES.length; i++) {
        if (lowercasePath.includes(IGNORED_DIRECTORIES[i])) {
            return true;
        }
    }

    const filename = path.split("/").pop() || "";

    // Checking file name list
    if (IGNORED_FILES.includes(filename.toLowerCase())) {
        return true;
    }

    // Checking file extension list
    for (let i = 0; i < IGNORED_EXTENSIONS.length; i++) {
        if (lowercasePath.endsWith(IGNORED_EXTENSIONS[i])) {
            return true;
        }
    }

    return false;
}

// Codebase scraper from github url
const scrapegithubRepository = async (githubUrl: string) => {
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Invalid GitHub Repository URL');

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");
    let branch = "main";
    const pathParts = match[2].split("/");
    if (pathParts[1] === "tree" || pathParts[1] === "blob") {
        branch = pathParts[2];
    }

    let tree: RepoFile[] = [];
    try {
        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const res = await axios.get(treeUrl);
        tree = res.data.tree;
    } catch (err) {
        try {
            const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
            const res = await axios.get(treeUrl);
            tree = res.data.tree;
        } catch (innerErr: any) {
            if (innerErr.response?.status === 404) {
                throw new Error("Repository not found or is private. Please make sure the URL is correct and the repository is public.");
            } else if (innerErr.response?.status === 403) {
                throw new Error("GitHub API rate limit exceeded or access denied. Please try again later.");
            }
            throw new Error(`Failed to access GitHub repository: ${innerErr.message}`);
        }
    }

    // Filter trees
    const allowedFiles = tree.filter(f => f.type === "blob" && !isIgnoredFile(f.path));

    // Split allowed files into config files and other code files
    const configfiles = allowedFiles.filter(f => IMPORTANT_FILES.includes(f.path.split("/").pop() || ""));
    const otherFiles = allowedFiles.filter(f => !IMPORTANT_FILES.includes(f.path.split("/").pop() || ""));

    // Combine lists and limit download target to 40 files for deeper coverage
    const targetFiles = [...configfiles, ...otherFiles].slice(0, 40);

    const fetchPromises = targetFiles.map(async (file) => {
        try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
            const response = await axios.get(rawUrl, { responseType: 'text' });
            const rawText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

            // Slices to 90000 characters (~1500 lines of code) to balance context depth and model performance
            return `\n--- FILE: ${file.path} ---\n${rawText.slice(0, 90000)}\n`;
        } catch {
            return `\n--- FILE: ${file.path} ---\n[Could not download file content]\n`;
        }
    });

    const fileContents = await Promise.all(fetchPromises);
    const codeContext = fileContents.join("");

    const folderTreeString = allowedFiles
        .slice(0, 50)
        .map(f => `- ${f.path}`)
        .join("\n");

    return {
        repoName: repo,
        folderTree: folderTreeString,
        codeContext: codeContext
    };
}

// Layer 1 Model Config
const MODEL_L1 = process.env.NEXT_PUBLIC_GEMINI_MODEL_LAYER1 || "gemma-4-31b-it";

// serves the filtered github repo data to layer 1 llm model
const generateRepoSummary = async (
    folderTree: string,
    codeContext: string,
    customInstructions?: string
): Promise<string> => {

    // Constructing Prompt
    let prompt = `Analyze this project codebase structure and configuration files:\n\n`;
    prompt += `Folder Layout:\n${folderTree}\n\n`;
    prompt += `File Contents:\n${codeContext}\n\n`;

    if (customInstructions) {
        prompt += `USER CUSTOM FOCUS REQUEST: Focus specifically on: "${customInstructions}". Extract detailed analysis, logic, and patterns related to this request.\n\n`;
    }

    prompt += `Output a dense, structured technical spec detailing the technology stack, project entry points, unique patterns, and module purpose. `;
    prompt += `PRIORITIZE: Focus heavily on the core architecture and features that the application implements. Highlight any unique implementations or tooling choices.\n`;
    prompt += `CRITICAL VERIFICATION AUDITING RULE: Compare your analysis against the actual "Folder Layout". Do NOT assume or hallucinate any files, directories, module paths, or dependency files that are not explicitly present in the Folder Layout. If a file is not in the layout list, it does not exist. Keep structural claims 100% accurate to the actual tree.\n`;
    prompt += `SAFETY GUARDRAIL: If any input files, descriptions, or directories contain content completely unrelated to coding, software, or project architecture, ignore them entirely.`;

    const systemInstruction = "You are an elite software architect and precise code layout auditor. Output a dense, concise technical spec sheet. Do not use emojis, maintain an absolute professional technical tone, and ignore all unrelated non-code inputs. You must verify your structural analysis and remove all hallucinated files/folders so that it matches the actual Folder Layout tree exactly. If the project contains very little data, summarize only what is present concisely without fabricating details.";

    let lastError: any = null;
    const maxAttempts = Math.max(totalKeysCount, 1);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const apiKey = getAPIkey();
        if (!apiKey) throw new Error("No API keys found.");

        const ai = new GoogleGenAI({ apiKey });

        try {
            console.log(`[Gemini Pipeline] Layer 1 - Starting codebase summary generation and verification using model: ${MODEL_L1}`);
            const res = await ai.models.generateContent({
                model: MODEL_L1,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.1,
                    maxOutputTokens: 8192
                }
            });
            console.log(`[Gemini Pipeline] Layer 1 - Summary generation and verification completed successfully!`);
            return res.text || "";
        }
        catch(err: any){

        }
    }
    throw new Error(`All API keys exhausted. Last Error: ${lastError?.message}`);
}

// Model 2 Config
const MODEL_L2 = process.env.NEXT_PUBLIC_GEMINI_MODEL_LAYER2 || "gemma-4-31b-it";

const generateFinalReadme = async (
    specSheet: string,
    customInstructions?: string
) => {

    // Contructing the prompt
    let prompt = `Write a professional README.md using the provided project specification spec sheet:\n\n`;
    prompt += `Project Specification Spec Sheet:\n${specSheet}\n\n`;

    if (customInstructions) {
        prompt += `USER CUSTOM FOCUS REQUEST: Focus specifically on: "${customInstructions}". Ensure this aspect is explained or followed in detail and styled prominently in the README.\n\n`;
    }

    prompt += `CRITICAL SYSTEM DOCUMENTATION RULES:\n`;
    prompt += `1. TONE & STYLE: Maintain an absolute professional technical tone. DO NOT use emojis anywhere in the README.\n`;
    prompt += `2. ZERO HALLUCINATION (IMPORTANT): DO NOT invent, assume, or speculate on any files, folders, directories, dependencies, or features that are not explicitly present in the provided specification sheet. We cannot generate info from nothing. Ground all content strictly in the provided data.\n`;
    prompt += `3. DYNAMIC LAYOUT SIZE & DENSITY (CONCISE VS. EXHAUSTIVE):\n`;
    prompt += `   You must autonomously evaluate the volume, depth, and completeness of the provided specification sheet:\n`;
    prompt += `   - IF THE SPEC SHEET DATA IS MINIMAL (brief outlines, very few details, or very short codebase context):\n`;
    prompt += `     * Re-route to a CONCISE README format of exactly 3-4 essential sections only:\n`;
    prompt += `       a. Project Header (Title, tagline, shields.io badges)\n`;
    prompt += `       b. Overview & Core Value (1-2 clear paragraphs expanding on what is provided, followed by a bullet list of provided features)\n`;
    prompt += `       c. Quick Start & Setup (basic commands derived strictly from the specification)\n`;
    prompt += `       d. Configuration & Environment Variables (only show variables if explicitly provided in the spec sheet; otherwise omit this section)\n`;
    prompt += `     * Do NOT try to stretch, repeat, or bloat the document. Keep it short, factual, and strictly aligned with the limited input data.\n`;
    prompt += `   - IF THE SPEC SHEET DATA IS COMPREHENSIVE (rich directory lists, extensive codebase context, and detailed requirements):\n`;
    prompt += `     * Follow the EXHAUSTIVE 9-section route with a target length of 700-1000 lines, explaining the architecture and files in depth:\n`;
    prompt += `       a. Project Header (Title, tagline, badges on the EXACT SAME line, separated only by spaces)\n`;
    prompt += `       b. Overview (3-4 detailed paragraphs explaining purpose, value proposition, and workflows)\n`;
    prompt += `       c. Technology Stack (detailed markdown table; DO NOT repeat shields.io badges here)\n`;
    prompt += `       d. Key Features (bulleted lists where each feature is described in a detailed 3-4 sentence paragraph)\n`;
    prompt += `       e. Directory & Code Architecture Layout (complete ASCII directory tree followed by a file-to-responsibility table)\n`;
    prompt += `       f. Installation & Local Setup (step-by-step guides for local dev, databases, testing, and production compilation)\n`;
    prompt += `       g. Usage Guidelines & Code Examples (multiple copy-pasteable configuration or integration snippets)\n`;
    prompt += `       h. Configuration & Environment Variables (tables mapping server/client config keys and security settings)\n`;
    prompt += `       i. Unique Aspects & Custom Focuses (deep-dives into 3-4 custom patterns, performance, or security designs)\n`;
    prompt += `4. DIAGRAMS & FLOWCHARTS: Do NOT use Mermaid.js diagram blocks (\`\`\`mermaid) under any circumstances. If representing processes or database layouts, use clean, readable ASCII text art, structured tables, or nested lists instead.\n`;
    prompt += `5. SAFETY GUARDRAIL: If the spec sheet contains content completely unrelated to coding or software architecture, ignore it fully and do not generate output.\n`;
    prompt += `6. NO REPETITIONS: Do not duplicate information or badges across different sections.\n`;
    prompt += `7. FINAL LAYOUT VERIFICATION: Ensure correct markdown syntax. All markdown tables, bullet lists, and code blocks must close correctly. Silently check the final generated README file for any syntax mistakes or layout formatting errors, and ensure all conversational introductory and outro remarks are completely deleted from the output.\n`;

    prompt += `\nFollow GitHub README best practices (e.g. clean headers, tables/grids, and code blocks).\n`;
    prompt += `Theme styling instruction: If the user has not directed any specific theme, design and format the README to display beautifully on a high-contrast dark theme (similar to this developer toolkit app's style - pure black background, thin dark borders, clear whitespace, and bright text accents). Use dark-theme compatible badges, logos, SVG elements, or markdown styles.\n`;
    prompt += `Output raw markdown only. Do not add intro/outro talk, and do not wrap the final output in markdown code blocks (\`\`\`).`;

    const systemInstruction = "You are an elite software documentation engine and Markdown QA editor. Output raw markdown only. Do not use emojis. Evaluate the density of the provided data autonomously and adapt the README length and section layouts accordingly: keep it concise for minimal inputs, and exhaustively detailed for rich inputs. Never hallucinate non-existent files or folders. You must check your final generated output for duplicate sections, formatting errors, or broken syntax, and remove them cleanly before writing.";


    // Key rotation retyr loop
    let lastError: any = null;
    const maxAttempts = Math.max(totalKeysCount, 1);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const apiKey = getAPIkey();
        if (!apiKey) throw new Error("No Api key Found.");

        const ai = new GoogleGenAI({ apiKey });

        try {
            console.log(`[Gemini Pipeline] Layer 2 - Starting final README.md documentation layout generation using model: ${MODEL_L2}`);
            const res = await ai.models.generateContent({
                model: MODEL_L2,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.2,
                    maxOutputTokens: 8192
                }
            });
            console.log(`[Gemini Pipeline] Layer 2 - Final README.md layout generation completed successfully!`);
            return res.text || "";
        } catch (err: any) {
            lastError = err;
            console.warn(`[Gemini Pipeline] Layer 2 - Key attempt ${attempt + 1} failed: ${err.message || err}.`);
            if (attempt < maxAttempts - 1) {
                continue;
            }
            throw err;
        }

    }

    throw new Error(`All API Keys exhausted in Layer 2. Last Error: ${lastError?.message}`);

}

// Polishes the manual input and serve the output to Layer 1 llm model
const polishManualInput = async (manualData: string): Promise<string> => {
    const systemInstruction = 
        "You are an expert technical writer and layout editor. Your task is to polish raw user project specifications into a clean, structured technical specification spec sheet.\n\n" +
        "CRITICAL AUDITING RULES:\n" +
        "1. Inspect the provided data fields (title, description, tech stack, and attributes).\n" +
        "2. Detect and silently discard any conversational fillers, placeholder text, or garbage tags (e.g., 'hello', 'test', 'blah', junk characters) inside the technologies list or description.\n" +
        "3. Only preserve genuine software technologies, frameworks, tools, database engines, and architectures.\n" +
        "4. Standardize the remaining valid details into a concise, professional spec sheet.\n" +
        "5. SAFETY GUARDRAIL: If the input data is completely unrelated to coding, software, or the project codebase, ignore it fully and do not output any specification.";

    let lastError: any = null;
    const maxAttempts = Math.max(totalKeysCount, 1);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const apiKey = getAPIkey();
        if (!apiKey) throw new Error("No API keys found.");

        const ai = new GoogleGenAI({ apiKey });

        try {
            console.log(`[Gemini Pipeline] Manual Polisher - Polishing raw input specification using model: ${MODEL_L1}`);
            const res = await ai.models.generateContent({
                model: MODEL_L1,
                contents: manualData,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.2,
                    maxOutputTokens: 8192
                }
            });
            console.log(`[Gemini Pipeline] Manual Polisher - Specification polishing completed successfully!`);
            return res.text || "";
        } catch (err: any) {
            lastError = err;
            console.warn(`[Gemini Pipeline] Manual Polisher - Key attempt ${attempt + 1} failed: ${err.message || err}.`);
            if (attempt < maxAttempts - 1) {
                continue;
            }
            throw err;
        }
    }
    throw new Error(`All API keys exhausted. Last Error: ${lastError?.message}`);
}

export const generateReadmeFromGithub = async (githubUrl: string, customInstructions?: string) => {
    // scraping the repository layout and config files
    const repoData = await scrapegithubRepository(githubUrl);

    // Layer 1 llm for ingesting folder tree and file contents to build spec sheet AND verify it in 1 call
    const specSheet = await generateRepoSummary(repoData.folderTree, repoData.codeContext, customInstructions);

    // Layer 2 llm for creating the final markdown from spec sheet AND verifying layout syntax in 1 call
    const readme = await generateFinalReadme(specSheet, customInstructions);

    return {
        readme,
        repoName: repoData.repoName
    }
}

export const generateReadmeFromManual = async (manualData: string, customInstructions?: string) => {
    // Layer 1 llm for polishing raw user input in 1 call
    const specSheet = await polishManualInput(manualData);

    // Layer 2 llm for creating final markdown AND verifying layout syntax in 1 call
    const readme = await generateFinalReadme(specSheet, customInstructions);

    return {
        readme
    }
}

export const generateGeminiFallback = async (
    systemInstruction: string,
    userPrompt: string
): Promise<{ text: string; modelUsed: string }> => {
    const models = [
        process.env.NEXT_PUBLIC_GEMINI_FALLBACK_MODEL_1 || "gemini-2.5-flash-lite",
        process.env.NEXT_PUBLIC_GEMINI_FALLBACK_MODEL_2 || "gemini-3-flash",
        process.env.NEXT_PUBLIC_GEMINI_FALLBACK_MODEL_3 || "gemini-3.5-flash"
    ];

    let lastError: any = null;

    for (const model of models) {
        const maxAttempts = totalKeysCount;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const apiKey = getAPIkey();
                if (!apiKey) throw new Error("No API key available");

                console.log(`[Gemini Fallback] Attempting model ${model} with key attempt ${attempt + 1}...`);
                const ai = new GoogleGenAI({ apiKey });
                const res = await ai.models.generateContent({
                    model: model,
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemInstruction,
                        temperature: 0.4
                    }
                });

                return {
                    text: res.text || "",
                    modelUsed: `${model} (Gemini)`
                };
            } catch (err: any) {
                lastError = err;
                console.warn(`[Gemini Fallback] Model ${model} failed with key attempt ${attempt + 1}: ${err.message || err}`);
            }
        }
    }

    throw new Error(`All Gemini fallback models exhausted. Last error: ${lastError?.message}`);
}