# DevToolkit AI

High-performance, AI-orchestrated developer productivity suite utilizing split-topology inference for deep-context synthesis and low-latency code generation.

## Overview

DevToolkit AI is engineered to bridge the gap between massive repository context and instantaneous developer workflows. Unlike standard LLM wrappers, this system implements a sophisticated split-topology inference model. This architecture separates heavy-duty, deep-context repository synthesis—which requires high reasoning capabilities and large context windows—from high-speed, low-latency tasks such as commit message generation and regex pattern creation.

The core value proposition lies in its intelligent orchestration layer. By utilizing a multi-layered approach to AI inference, the system mitigates the common pitfalls of LLM integration: hallucinations, rate-limiting, and high latency. The system doesn't just send prompts to an API; it audits the repository structure, filters noise through client-side preprocessing, and routes requests through a prioritized fallback queue to ensure maximum uptime and accuracy.

Through the integration of Google Gemini for deep analysis and Groq for rapid execution, DevToolkit AI provides a seamless developer experience. It transforms raw repository data into structured documentation, automates repetitive git tasks, and provides utility toolkits for JSON and Regex manipulation, all while maintaining strict structural integrity through automated verification layers.

## Technology Stack

| Layer | Technology | Implementation Detail |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2.10 | App Router architecture for optimized routing and SSR/RSC |
| **Language** | TypeScript 5.9.3 | Strict type safety across the entire service layer |
| **Deep Inference** | Google GenAI (Gemini) | Multi-layer synthesis and repository auditing |
| **Fast Inference** | Groq SDK | High-speed Llama-based generation and fallback logic |
| **Database** | MongoDB | Persistent storage via Mongoose 9.7.4 |
| **Authentication** | NextAuth.js 5.0.0-beta.31 | Secure session management and user identity |
| **Styling** | Tailwind CSS 4 | Utility-first styling for high-performance UI |
| **Validation** | Zod 4.4.3 | Schema-based runtime validation for all API inputs |

## Key Features

* **Multi-Layered Repository Synthesis**
  The README generation pipeline utilizes a sophisticated two-layer Gemini process. The first layer performs deep analysis by scraping GitHub repositories and aggressively filtering out non-essential noise such as lockfiles, binaries, and build artifacts. The second layer takes this audited specification and synthesizes it into professional Markdown. A dedicated verification layer cross-references the output against the actual folder layout to prevent the hallucination of non-existent files.

* **Smart Model Selection & Fallback**
  The system implements an intelligent routing logic via the Groq service. Instead of a one-size-fits-all approach, the system evaluates input size to determine the optimal model. Small, rapid tasks are routed to `llama-3.1-8b-instant` for near-instant response times, while complex, large-scale inputs are routed to `groq/compound-mini`. In the event of rate limits, a prioritized fallback chain ensures continuous service availability.

* **Intelligent Git Workflow Automation**
  The commit message generator is optimized for token efficiency and accuracy. By implementing client-side preprocessing, the system strips out dependency lockfiles and irrelevant metadata from git diffs before they ever reach the inference engine. This reduces costs, minimizes latency, and ensures the AI focuses strictly on the logic changes within the code.

* **Developer Utility Suite**
  Beyond documentation and git automation, the toolkit provides structured interfaces for common developer tasks. This includes a JSON toolkit utilizing `@uiw/react-json-view` for high-fidelity data visualization and a regex generator that uses a structured JSON-based prompt interface to ensure pattern accuracy and usability.

## Directory & Code Architecture Layout

```text
src/
├── app/
│   └── api/
│       ├── gemini/          # Deep synthesis orchestration
│       ├── groq/            # Fast inference routing
│       ├── history/         # User activity persistence
│       └── usage/           # Rate limit and quota management
├── components/
│   ├── commit-msg-generator/
│   │   └── CommitGenerator.tsx  # Preprocessing & Groq integration
│   ├── json-toolkit/
│   │   └── JSONView.tsx         # @uiw/react-json-view implementation
│   ├── readme-generator/
│   │   ├── ReadmeGenerator.tsx  # Multi-stage Gemini pipeline
│   │   └── ReadmeLoader.tsx     # UI state management for synthesis
│   └── regex-generator/
│       └── RegexInterface.tsx   # Structured JSON prompt interface
├── context/
│   └── AppContext.tsx       # Centralized state & session management
├── lib/
│   ├── constants.ts         # API key pooling & configuration
│   ├── dbConnect.ts         # MongoDB singleton connection
│   ├── geminiService.ts     # Layer 1 & 2 synthesis logic
│   ├── groqService.ts       # Smart model selector & fallback logic
│   └── rateLimiter.ts       # UsageModel-based quota enforcement
├── models/
│   ├── history.model.ts     # Mongoose schema for task logs
│   ├── usage.model.ts       # Mongoose schema for rate limiting
│   └── user.model.ts        # Mongoose schema for user profiles
└── validations/
    └── schema.ts            # Zod validation definitions
```

### File Responsibility Mapping

| File/Module | Primary Responsibility |
| :--- | :--- |
| `src/lib/geminiService.ts` | Executes the two-layer analysis and synthesis pipeline. |
| `src/lib/groqService.ts` | Manages model routing, input sizing, and fallback chains. |
| `src/lib/rateLimiter.ts` | Enforces daily request quotas via the `UsageModel`. |
| `src/lib/constants.ts` | Manages the round-robin API key pooling strategy. |
| `src/validations/` | Ensures all API requests conform to strict Zod schemas. |
| `src/context/AppContext.tsx` | Manages global state for tools, quotas, and sessions. |
| `src/components/commit-msg-generator/` | Handles client-side diff preprocessing to save tokens. |

## Configuration & Environment Variables

The system requires the following environment variables to maintain operational continuity and inference performance.

| Variable | Type | Description |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | String | Primary authentication key for the Groq inference engine. |
| `GEMINI_API_KEYS` | CSV | A comma-separated list of keys used for round-robin pooling. |
| `GROQ_MODEL_FALLBACK_CHAIN` | String | Ordered list of models for automatic failover during 429 errors. |
| `MONGODB_URI` | String | Connection string for the MongoDB persistence layer. |
| `DAILY_RATE_LIMIT` | Integer | Maximum number of permitted requests per user per day. |

## Unique Implementation Patterns

### Split-Topology Inference Model
The architecture avoids the "monolithic prompt" trap by splitting tasks based on their computational requirements. Deep-context tasks (README synthesis) are routed through a multi-layered Gemini pipeline, while high-velocity tasks (Commit messages, Regex) are routed through Groq. This ensures that the user never waits for a heavy model when a fast model is sufficient, and never loses quality when a complex task is required.

### Round-Robin API Key Pooling
To bypass the strict rate limits imposed by high-performance LLM providers, the `geminiService.ts` implements a round-robin strategy. By utilizing a CSV list of keys defined in `GEMINI_API_KEYS`, the system rotates through available credentials, effectively multiplying the available throughput and ensuring high availability for the synthesis pipeline.

### Structural Auditing & Hallucination Guardrails
A critical component of the system is the `verifyRepoSummary` function. This function acts as a structural validator that compares the AI's generated output against the actual filesystem tree. If the AI attempts to reference a file or directory that was not identified during the Layer 1 analysis phase, the system flags the discrepancy, ensuring that the final documentation is a 100% accurate representation of the repository.

### Client-Side Token Optimization
The `CommitGenerator` component implements a `preprocessDiff` utility. This function performs heavy lifting on the client side by stripping out large, non-functional files (like `package-lock.json` or `yarn.lock`) from the git diff before it is sent to the API. This pattern significantly reduces token consumption, lowers latency, and prevents the model from being distracted by irrelevant dependency metadata.

*Generated by [DevToolkit-AI](https://dev-toolkit-ai.vercel.app/)*