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
        // Fallback for repositories using 'master' branch instead of 'main'
        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
        const res = await axios.get(treeUrl);
        tree = res.data.tree;
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
    prompt += `SAFETY GUARDRAIL: If any input files, descriptions, or directories contain content completely unrelated to coding, software, or project architecture, ignore them entirely.`;

    const systemInstruction = "You are a professional code architecture parser. Output a dense, concise technical spec sheet. Do not use emojis, maintain an absolute professional technical tone, ignore all unrelated non-code inputs, and verify the output against the prompt before rendering.";

    let lastError: any = null;
    const maxAttempts = Math.max(totalKeysCount, 1);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const apiKey = getAPIkey();
        if (!apiKey) throw new Error("No API keys found.");

        const ai = new GoogleGenAI({ apiKey });

        try {
            console.log(`[Gemini Pipeline] Layer 1 - Starting codebase summary generation using model: ${MODEL_L1}`);
            const res = await ai.models.generateContent({
                model: MODEL_L1,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.2
                }
            });
            console.log(`[Gemini Pipeline] Layer 1 - Summary generation completed successfully!`);
            return res.text || "";
        } catch (err: any) {
            lastError = err;
            const isRateLimit = err?.status === 429 ||
                err?.message?.toLowerCase().includes("quota") ||
                err?.message?.includes("429");

            if (isRateLimit && attempt < maxAttempts - 1) {
                console.warn("Key rate limit hit. Retrying with next key...");
                continue;
            }
            throw err;
        }
    }
    throw new Error(`All API keys exhausted. Last Error: ${lastError?.message}`);
}

// Polishes the manual input and serve the output to Layer 1 llm model
const polishManualInput = async (manualData: string): Promise<string> => {
    const systemInstruction = 
        "You are an expert technical writer. Your task is to polish raw user project specifications into a clean, structured technical specification spec sheet.\n\n" +
        "CRITICAL AUDITING RULES:\n" +
        "1. Inspect the provided data fields (title, description, tech stack, and attributes).\n" +
        "2. Detect and silently discard any conversational fillers, placeholder text, or garbage tags (e.g., 'hello', 'test', 'blah', junk characters) inside the technologies list or description.\n" +
        "3. Only preserve genuine software technologies, frameworks, tools, database engines, and architectures.\n" +
        "4. Standardize the remaining valid details into a concise, professional spec sheet.\n" +
        "5. SAFETY GUARDRAIL: If the input data is completely unrelated to coding, software, or the project codebase, ignore it fully and do not output any specification.";

    // Key rotation retry loop implemented directly in the function
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
                    temperature: 0.2
                }
            });
            console.log(`[Gemini Pipeline] Manual Polisher - Specification polishing completed successfully!`);
            return res.text || "";
        } catch (err: any) {
            lastError = err;
            const isRateLimit = err?.status === 429 ||
                err?.message?.toLowerCase().includes("quota") ||
                err?.message?.includes("429");

            if (isRateLimit && attempt < maxAttempts - 1) {
                console.warn("Key rate limit hit. Retrying with next key...");
                continue;
            }
            throw err;
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
    let prompt = `Write a highly comprehensive, professional README.md using the provided project specification spec sheet:\n\n`;
    prompt += `Project Specification Spec Sheet:\n${specSheet}\n\n`;

    if (customInstructions) {
        prompt += `USER CUSTOM FOCUS REQUEST: Focus specifically on: "${customInstructions}". Ensure this aspect is explained or followed in detail and styled prominently in the README.\n\n`;
    }

    prompt += `CRITICAL DOCUMENTATION RULES:\n`;
    prompt += `1. TONE & STYLE: Maintain an absolute professional technical tone. DO NOT use emojis anywhere in the README.\n`;
    prompt += `2. ARCHITECTURE & UNIQUE FEATURES: Focus on and prioritize the main architecture and features of the application. If the project contains unique integrations, custom patterns, or unique logic, clearly call them out and explain them in detail.\n`;
    prompt += `3. EXCLUSION POLICY: Do NOT include standard placeholder sections (e.g. 'Deployment', 'License', 'Contributing') unless they are explicitly specified or present in the specification sheet.\n`;
    prompt += `4. LENGTH REQUIREMENT: Always produce a detailed, exhaustive README with a target length of 600-700 lines of markdown to ensure a complete, production-grade guide, unless the user explicitly requested to be concise.\n`;
    prompt += `5. STRUCTURAL ORDERING: Arrange the README sections in the following strict order:\n`;
    prompt += `   a. Project Header (Title, Subtitle/Motto, Badges)\n`;
    prompt += `   b. Overview / What is the project about (value proposition, problems solved, use cases)\n`;
    prompt += `   c. Technology Stack (languages, frameworks, databases, libraries)\n`;
    prompt += `   d. Key Features (bulleted lists with descriptions)\n`;
    prompt += `   e. Directory & Code Architecture Layout (structure tree with explanations)\n`;
    prompt += `   f. Installation & Local Setup (step-by-step instructions)\n`;
    prompt += `   g. Usage Guidelines & Code Examples\n`;
    prompt += `   h. Configuration & Environment Variables (tables or code blocks)\n`;
    prompt += `   i. Unique Aspects & Custom Focuses (specific details, customized features)\n`;
    prompt += `6. DIAGRAMS & FLOWCHARTS: Use creative text-based/ASCII flowcharts, diagrams, or block schemas in Markdown if needed to visually present complex architectures, logic flows, or database relationships.\n`;
    prompt += `7. SAFETY GUARDRAIL: If the spec sheet or repository context contains content completely unrelated to coding, software, or project architecture, ignore it fully and do not generate output for those sections.\n\n`;

    prompt += `Follow GitHub README best practices (e.g. clean headers, tables/grids, and code blocks).\n`;
    prompt += `Theme styling instruction: If the user has not directed any specific theme, design and format the README to display beautifully on a high-contrast dark theme (similar to this developer toolkit app's style - pure black background, thin dark borders, clear whitespace, and bright text accents). Use dark-theme compatible badges, logos, SVG elements, or markdown styles.\n`;
    prompt += `Output raw markdown only. Do not add intro/outro talk, and do not wrap the final output in markdown code blocks (\`\`\`).`;

    const systemInstruction = "You are an elite software documentation engine. Output raw markdown only. Do not use emojis.";


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
                    temperature: 0.4
                }
            });
            console.log(`[Gemini Pipeline] Layer 2 - Final README.md layout generation completed successfully!`);
            return res.text || "";
        } catch (err: any) {
            lastError = err;
            const isRateLimit = err?.status === 429 ||
                err?.message?.toLowerCase().includes("quota") ||
                err?.message?.includes("429");

            if (isRateLimit && attempt < maxAttempts - 1) {
                continue;
            }

            throw err;
        }

    }

    throw new Error(`All API Keys exhausted in Layer 2. Last Error: ${lastError?.message}`);

}

export const generateReadmeFromGithub = async (githubUrl: string, customInstructions?: string) => {
    // scraping the repository layout and config files
    const repoData = await scrapegithubRepository(githubUrl);

    // Layer 1 llm for ingesting folder tree and file contents to build spec sheet
    const specSheet = await generateRepoSummary(repoData.folderTree, repoData.codeContext, customInstructions);

    // Layer 2 llm for creating the final markdown from spec sheet
    const readme = await generateFinalReadme(specSheet, customInstructions);

    return {
        readme,
        repoName: repoData.repoName
    }
}

export const generateReadmeFromManual = async (manualData: string, customInstructions?: string) => {
    // Layer 1 llm for polishing and structuring the raw user input
    const specSheet = await polishManualInput(manualData);

    // Layer 2 llm for creating final markdown
    const readme = await generateFinalReadme(specSheet, customInstructions);

    return {
        readme
    }
}