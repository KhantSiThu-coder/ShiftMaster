
import { GoogleGenAI } from "@google/genai";
import { Shift } from "../types";

export const getShiftInsights = async (shifts: Shift[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const shiftsJson = JSON.stringify(shifts.slice(-10)); // Analyze last 10 shifts
  const prompt = `
    I have the following work shifts stored in JSON format:
    ${shiftsJson}

    Analyze this schedule and provide a 2-3 sentence summary. 
    Focus on patterns like:
    - Frequent late nights.
    - Average shift length.
    - Recommendations for rest or productivity.
    Be encouraging and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful workplace assistant and productivity coach.",
        temperature: 0.7,
      }
    });

    return response.text || "No insights available at the moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to fetch AI insights. Please check your schedule and try again later.";
  }
};
