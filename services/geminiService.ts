import { GoogleGenAI, Type } from "@google/genai";
import { KPI, GeminiInsight } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTradingInsight = async (kpis: KPI[]): Promise<GeminiInsight> => {
  try {
    const kpiSummary = kpis.map(k => `${k.label}: ${k.value} (${k.change}% ${k.trend})`).join(', ');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze these trading metrics: ${kpiSummary}. Provide a brief executive summary, 2 actionable items, and a risk assessment level.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A concise 1-2 sentence summary of current performance." },
            actionableItems: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Two specific actions the trading manager should take." 
            },
            riskLevel: { 
              type: Type.STRING, 
              enum: ["Low", "Medium", "High"],
              description: "Current operational risk level." 
            }
          },
          required: ["summary", "actionableItems", "riskLevel"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");
    
    return JSON.parse(jsonText) as GeminiInsight;
  } catch (error) {
    console.error("Failed to generate insight:", error);
    return {
      summary: "Unable to generate real-time insight. Please check API connectivity.",
      actionableItems: ["Check network connection", "Verify API Key"],
      riskLevel: "Low"
    };
  }
};
