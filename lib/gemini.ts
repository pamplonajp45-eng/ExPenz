import { GoogleGenerativeAI } from "@google/generative-ai";

// Load all three API keys
const API_KEYS = [
  process.env.EXPO_PUBLIC_GEMINI_API_KEY_1 || "",
  process.env.EXPO_PUBLIC_GEMINI_API_KEY_2 || "",
  process.env.EXPO_PUBLIC_GEMINI_API_KEY_3 || "",
].filter((key) => key !== ""); // Remove empty keys

let currentKeyIndex = 0;

const getModel = () => {
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys found in environment variables");
  }

  const currentKey = API_KEYS[currentKeyIndex];
  const genAI = new GoogleGenerativeAI(currentKey);
  return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
};

// Function to rotate to next key
export const rotateAPIKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(
    `🔄 Rotated to API key ${currentKeyIndex + 1}/${API_KEYS.length}`,
  );
  return getModel();
};

// Get current key index for logging
export const getCurrentKeyIndex = () => currentKeyIndex + 1;
export const getTotalKeys = () => API_KEYS.length;
export const getModelWithRotation = getModel; // Export getter function

console.log("🔑 Gemini Config: ", API_KEYS.length, "keys loaded");

// Lazy initialization - only create model when first needed
let modelInstance: any = null;

const initModel = () => {
  if (modelInstance) return modelInstance;
  
  if (API_KEYS.length === 0) {
    console.warn("⚠️ No Gemini API keys configured. AI features will be disabled.");
    // Return a mock model that fails gracefully
    modelInstance = {
      generateContent: async () => ({
        response: {
          text: () => "AI features are not configured. Please add your Gemini API keys to .env.local"
        }
      })
    };
    return modelInstance;
  }
  
  modelInstance = getModel();
  return modelInstance;
};

// Using gemini-flash-latest as "gemini-1.5-flash" is not found for this project
// Export a wrapper that initializes the model lazily
export const model = {
  generateContent: async (prompt: string) => {
    const m = initModel();
    return await m.generateContent(prompt);
  }
} as any;
