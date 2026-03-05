import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
console.log("Gemini Config: Key present =", !!process.env.EXPO_PUBLIC_GEMINI_API_KEY);

// Using gemini-flash-latest as "gemini-1.5-flash" is not found for this project
export const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
