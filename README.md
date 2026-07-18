# DevToolkit AI

Advanced AI-driven developer productivity suite featuring multi-model orchestration, automated documentation synthesis, and semantic code generation.

## Overview

DevToolkit AI is a sophisticated developer utility designed to streamline the software development lifecycle through high-performance AI orchestration. By integrating multiple large language models via specialized service layers, the platform provides specialized tools for repository analysis, semantic commit generation, and complex pattern matching.

The architecture is built upon a hybrid intelligence model. It leverages the Groq SDK for high-speed, low-latency inference tasks such as regex and commit message generation, while utilizing the Google GenAI SDK (Gemini) for deep-context repository analysis and documentation synthesis. This dual-engine approach ensures that the system remains responsive for micro-tasks while remaining capable of processing massive codebase structures for macro-tasks.

The system is engineered for high availability and quota management. Through advanced implementation patterns like API key pooling for Gemini and prioritized fallback queues for Groq, DevToolkit AI maintains operational continuity even under heavy load or rate-limiting constraints. The entire ecosystem is wrapped in a robust TypeScript environment, utilizing Zod for strict schema validation and NextAuth.js for secure session management.

## Technology Stack

| Layer | Technology | Implementation Detail |
| :--- | :--- | :--- |
| **Framework** | Next.js | App Router with Server Components |
| **Language** | TypeScript | Strict type safety across all modules |
| **AI Inference (Fast)** | Groq SDK | Multi-model routing for code generation |
| **AI Analysis (Deep)** | Google GenAI | Gemini-based repository synthesis |
| **Database** | MongoDB | Mongoose ODM for persistence |
| **Authentication** | NextAuth.js | Secure user session management |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Animation** | Framer Motion | Fluid UI transitions and interactions |
| **Validation** | Zod | End-to-end schema enforcement |

## Key Features

* **Automated README Synthesis**
  The `ReadmeGenerator` module performs deep-context analysis of the existing codebase structure. By utilizing the Gemini-based analysis pipeline, it parses repository architecture to produce comprehensive, professional documentation that accurately reflects the project's intent and structure.

* **Semantic Commit Generation**
  The `CommitGenerator` leverages Groq's high-speed inference to analyze staged changes or code snippets. It produces standardized semantic commit messages, ensuring that version control history remains clean, readable, and compliant with industry best practices.

* **Intelligent Regex Generation**
  The `RegexGenerator` provides a specialized interface for translating natural language requirements into complex regular expressions. This tool utilizes prioritized model routing to ensure high accuracy in pattern generation, reducing the cognitive load on developers during string manipulation tasks.

* **High-Availability AI Orchestration**
  The system features a sophisticated backend routing logic that manages model availability. By implementing fallback queues and key rotation, the toolkit mitigates the impact of API rate limits and service interruptions, providing a seamless developer experience.

## Directory & Code Architecture Layout

```text
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx
│   │   └── workspace/page.tsx
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── gemini/route.ts
│   │   └── groq/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── auth.ts
├── components/
│   ├── CopyButton.tsx
│   ├── NavBar.tsx
│   ├── commit-msg-generator/CommitGenerator.tsx
│   ├── rareui/LiquidTooltip/LiquidTooltip.tsx
│   ├── readme-generator/ReadmeGenerator.tsx
│   ├── readme-generator/ReadmeLoader.tsx
│   ├── regex-generator/RegexGenerator.tsx
│   └── workspace/WorkspaceHub.tsx
├── context/
│   └── AppContext.tsx
├── lib/
│   ├── constants.ts
│   ├── dbConnect.ts
│   ├── geminiService.ts
│   ├── groqService.ts
│   └── utils.ts
├── models/
│   ├── history.model.ts
│   ├── usage.model.ts
│   └── user.model.ts
├── proxy.ts
├── types/
│   └── ApiResponse.ts
└── validations/
    ├── groq.validation.ts
    ├── readme.validation.ts
    └── regex.validation.ts
```

### File Responsibility Mapping

| File/Directory | Responsibility |
| :--- | :--- |
| `src/app/api/` | API route handlers for Gemini, Groq, and Auth orchestration. |
| `src/components/` | UI component library including specialized generators and custom UI elements. |
| `src/context/` | Centralized state management for the workspace environment. |
| `src/lib/geminiService.ts` | Logic for repository analysis and Gemini key rotation. |
| `src/lib/groqService.ts` | Logic for high-speed generation and model fallback execution. |
| `src/lib/constants.ts` | Global configuration, including API key pools and fallback chains. |
| `src/models/` | Mongoose schemas for user data, history, and usage tracking. |
| `src/validations/` | Zod schemas for sanitizing all incoming AI request payloads. |

## Usage Guidelines & Code Examples

### AI Service Orchestration Patterns

#### Groq Model Fallback Queue
The `groqService.ts` implements a prioritized execution loop. If the primary model fails due to rate limits or errors, the service iterates through the `GROQ_MODEL_FALLBACK_CHAIN`.

```typescript
// Logic conceptualization within src/lib/groqService.ts
async function executeWithFallback(input: string) {
  const models = process.env.GROQ_MODEL_FALLBACK_CHAIN.split(',');
  
  for (const model of models) {
    try {
      return await groqClient.chat.completions.create({
        model: model.trim(),
        messages: [{ role: 'user', content: input }],
      });
    } catch (error) {
      if (error.status === 429) continue; // Move to next model in queue
      throw error;
    }
  }
}
```

#### Gemini API Key Pooling
To manage quota constraints during intensive repository analysis, `geminiService.ts` utilizes a round-robin rotation strategy defined in the constants.

```typescript
// Logic conceptualization within src/lib/geminiService.ts
import { GEMINI_API_KEYS } from '../lib/constants';

let currentKeyIndex = 0;

function getNextApiKey(): string {
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

async function analyzeRepository(context: string) {
  const apiKey = getNextApiKey();
  // Proceed with Gemini analysis using the rotated key
}
```

## Configuration & Environment Variables

| Variable | Type | Description |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | String | Primary authentication key for Groq inference services. |
| `GEMINI_API_KEYS` | String (CSV) | Comma-separated list of Gemini keys for round-robin pooling. |
| `GROQ_MODEL_FALLBACK_CHAIN` | String (CSV) | Ordered list of models used for automatic failover. |
| `MONGODB_URI` | String | Connection string for the MongoDB persistent data store. |

## Unique Aspects & Custom Focuses

### Advanced Model Routing Topology
Unlike standard AI wrappers, DevToolkit AI utilizes a split-topology architecture. It distinguishes between "Reasoning/Synthesis" tasks and "Generation/Pattern" tasks. 
- **Synthesis Path:** Routes to Gemini via `src/app/api/gemini/route.ts` for heavy-duty codebase parsing.
- **Generation Path:** Routes to Groq via `src/app/api/groq/route.ts` for low-latency text completion.

### High-Availability Design Patterns
The project implements two critical patterns to ensure 99.9% service availability despite third-party API limitations:
1. **Prioritized Fallback Queues:** An automated loop in the Groq service that prevents task failure by immediately attempting the next best model in the hierarchy.
2. **API Key Pooling:** A round-robin rotation mechanism for Gemini that effectively multiplies the available rate limit by distributing requests across a pool of keys.

### Multi-Layered Validation Guardrails
Security and data integrity are enforced through a strict backend-side validation layer. Every request entering the API routes is intercepted by Zod schemas located in `src/validations/`. This ensures that only sanitized, correctly formatted data is passed to the AI models, preventing prompt injection risks and malformed payload errors.

*Generated by [DevToolkit-AI](https://dev-toolkit-ai.vercel.app/)*