import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to check API key
export const checkApiKey = (): boolean => {
  return !!apiKey;
};

export const generateVideoMetadata = async (topic: string, tone: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a YouTube SEO Expert. Generate metadata for a video about "${topic}". Tone: ${tone}.
      
      Return a JSON object with:
      1. 5 click-worthy, high CTR titles.
      2. A compelling video description (first 2 lines are hooks).
      3. 15 comma-separated tags.
      
      Output JSON only.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            description: { type: Type.STRING },
            tags: { type: Type.STRING }
          }
        }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Optimization Error:", error);
    throw error;
  }
};

export const generateScript = async (title: string, points: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Write a full YouTube video script for the title: "${title}".
      Key points to cover: ${points}.
      
      Structure:
      1. Hook (0-30s): Grab attention immediately.
      2. Intro: Brief context.
      3. Body: Detailed content.
      4. CTA (Call to Action).
      5. Outro.
      
      Use Markdown formatting. Make it engaging and conversational.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Script Error:", error);
    throw error;
  }
};

export const findTrends = async (niche: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find the latest trending topics and news in the "${niche}" niche using Google Search.
      Identify 5 breakout trends that would make good YouTube videos right now.
      For each trend, suggest a video angle.
      
      Format the output as a clean Markdown list. Include links to sources where possible.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    return {
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Gemini Trend Error:", error);
    throw error;
  }
};

export const analyzeThumbnail = async (base64Image: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG for simplicity from canvas/input
              data: base64Image
            }
          },
          {
            text: `Analyze this YouTube thumbnail. Video Context: ${context || 'General YouTube Video'}.
            
            Provide:
            1. A CTR Score (1-10).
            2. 3 Strengths.
            3. 3 Weaknesses.
            4. Specific actionable advice to improve it (colors, text, emotion, composition).
            
            Keep it concise and critical.`
          }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};
