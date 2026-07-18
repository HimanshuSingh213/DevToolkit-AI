const ApiKeys = process.env.GEMINI_API_KEYS;
export const keysPool = ApiKeys?.split(",").map(key => key.trim()).filter(Boolean) || [];
export const totalKeysCount = keysPool.length;
let APIIndex = 0;

export const DAILY_RATE_LIMIT = process.env.DAILY_RATE_LIMIT ? parseInt(process.env.DAILY_RATE_LIMIT, 10) : 80;

// selects the api keys one by one 
export default function getAPIkeys(): string {
    if (keysPool.length === 0) return "";

    const key = keysPool[APIIndex % keysPool.length];
    APIIndex = (APIIndex + 1) % keysPool.length; // prevents the index no. from growing infinitely
    return key;
}