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

// Using gemini-flash-latest as "gemini-1.5-flash" is not found for this project
export const model = getModel();
