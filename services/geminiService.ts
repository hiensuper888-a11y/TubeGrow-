import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";

// Helper to check API key safety
const getApiKey = () => {
  try {
    // Check process.env (Standard Node/Vercel)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
    // Check import.meta.env (Vite/Modern Bundlers)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    console.warn("Error accessing environment variables", e);
  }
  return 'AIzaSyBkpRo1ZxRXTTV4djHQHT6A6SMKihdVUaw';
};

const apiKey = getApiKey();

// Initialize AI cautiously. 
let ai: GoogleGenAI;
try {
    ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });
} catch (error) {
    console.error("Failed to initialize GoogleGenAI", error);
    ai = { models: {}, chats: {} } as any; 
}

// Helper to check API key
export const checkApiKey = (): boolean => {
  return !!apiKey && apiKey !== 'dummy-key-to-prevent-crash';
};

const getLangName = (lang: Language) => {
  switch (lang) {
    case 'vi': return 'Vietnamese';
    case 'zh': return 'Chinese (Simplified)';
    case 'ja': return 'Japanese';
    default: return 'English';
  }
};

/**
 * ULTRA-ROBUST JSON PARSER
 * Extracts JSON objects from messy AI responses (Markdown, text, etc.)
 */
export const cleanAndParseJson = (text: string) => {
  if (!text) return null;
  
  try {
    // 1. Try direct parse first (best case)
    return JSON.parse(text);
  } catch (e) {
    // 2. Try extracting from Markdown code blocks ```json ... ```
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      try {
        return JSON.parse(markdownMatch[1]);
      } catch (e2) {
        // Continue to step 3
      }
    }

    // 3. Brute force: Find the first '{' and the last '}'
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonCandidate);
      }
    } catch (e3) {
      console.error("JSON Parse Logic Failed completely:", e3);
    }
    
    return null;
  }
};

export const generateVideoMetadata = async (topic: string, tone: string, language: Language) => {
  if (!checkApiKey()) throw new Error("Missing API Key");
  
  try {
    const langName = getLangName(language);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a YouTube SEO Expert. Generate metadata for a video about "${topic}". Tone: ${tone}.
      
      IMPORTANT: The content MUST be generated in ${langName}.
      
      Return a JSON object with:
      1. 5 click-worthy, high CTR titles in ${langName}.
      2. A compelling video description in ${langName} (first 2 lines are hooks).
      3. 15 comma-separated tags in ${langName}.
      
      Output JSON only. Do not add any markdown formatting.`,
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

export const generateScript = async (title: string, points: string, language: Language) => {
  if (!checkApiKey()) throw new Error("Missing API Key");

  try {
    const langName = getLangName(language);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Write a full YouTube video script for the title: "${title}".
      Key points to cover: ${points}.
      
      IMPORTANT: Write the entire script in ${langName}.
      
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

export const findTrends = async (niche: string, language: Language) => {
  if (!checkApiKey()) throw new Error("Missing API Key");

  try {
    const langName = getLangName(language);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find the latest trending topics and news in the "${niche}" niche using Google Search.
      Identify 5 breakout trends that would make good YouTube videos right now.
      For each trend, suggest a video angle.
      
      IMPORTANT: Provide the response in ${langName}. Focus on trends relevant to speakers of this language if applicable, or global trends explained in ${langName}.
      
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

export const analyzeThumbnail = async (base64Image: string, mimeType: string, context: string, language: Language) => {
  if (!checkApiKey()) throw new Error("Missing API Key");

  try {
    const langName = getLangName(language);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: `Analyze this YouTube thumbnail. Video Context: ${context || 'General YouTube Video'}.
            
            IMPORTANT: Provide the analysis in ${langName}.
            
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

export const auditVideo = async (url: string, language: Language) => {
  if (!checkApiKey()) throw new Error("Missing API Key");

  try {
    const langName = getLangName(language);
    
    // Fallback: If URL is invalid, throw early
    if (!url.includes('youtu')) {
        throw new Error("Invalid YouTube URL");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a YouTube Algorithm Expert.
      I have a YouTube video Link: ${url}
      
      TASK:
      1. Use Google Search to find the EXACT Title and EXACT Channel Name of this video.
      2. Analyze why this video is good or bad.
      3. CRITICAL: Provide the response entirely in ${langName}.
      
      RETURN RAW JSON ONLY (Start with { and end with }). NO MARKDOWN.
      {
        "videoTitle": "Found Title",
        "channelName": "Found Channel Name",
        "score": 85, 
        "summary": "Short explanation in ${langName}.",
        "positives": ["Good point 1", "Good point 2"],
        "negatives": ["Improvement 1", "Improvement 2"],
        "suggestions": ["Action 1", "Action 2"]
      }`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
};

export const generateThumbnailImage = async (prompt: string, aspectRatio: string = "16:9") => {
  if (!checkApiKey()) throw new Error("Missing API Key");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `Create a high CTR YouTube thumbnail. 
            PROMPT: ${prompt}. 
            Style: High saturation, emotional, 4k resolution, youtube catchy style.
            Ratio: ${aspectRatio}.`
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K" 
        }
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Thumbnail Gen Error:", error);
    throw error;
  }
};

export const generateViralStrategy = async (topic: string, language: Language) => {
  if (!checkApiKey()) throw new Error("Missing API Key");

  try {
    const langName = getLangName(language);
    const isUrl = topic.toLowerCase().includes('youtube.com') || topic.toLowerCase().includes('youtu.be');
    
    let contents = '';
    
    // Strict structure for cleaner parsing
    const jsonStructure = `
    {
      "originalChannel": "Channel Name (if URL provided) or N/A",
      "strategyTitle": "Viral Strategy Title",
      "trendContext": "Why is this relevant now?",
      "analysis": {
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"]
      },
      "targetAudience": "Target Audience Description",
      "metadata": {
        "titleOptions": ["Title 1", "Title 2", "Title 3"],
        "description": "Video Description",
        "tags": ["tag1", "tag2", "tag3"]
      },
      "thumbnailIdea": {
        "visualDescription": "Detailed visual description for AI generator",
        "textOverlay": "Text on thumbnail"
      },
      "scriptOutline": {
        "hook": "0-10s Hook",
        "contentBeats": ["Point 1", "Point 2", "Point 3"],
        "cta": "Call to Action"
      },
      "promotionPlan": ["Tactic 1", "Tactic 2"]
    }`;

    let config: any = {};

    if (isUrl) {
      config.tools = [{ googleSearch: {} }];
      
      contents = `You are a World-Class YouTube Strategist.
      
      INPUT: YouTube URL: "${topic}".
      
      TASK:
      1. Search this video's title, EXACT Channel Name, and performance using Google Search.
      2. ANALYZE the video in ${langName}.
      3. Generate a "Viral Strategy" for a NEW competing video in ${langName}.
      
      CRITICAL: RETURN RAW JSON ONLY (Start with { and end with }). NO MARKDOWN.
      Structure:
      ${jsonStructure}`;
    } else {
      contents = `You are a YouTube Strategist. Topic: "${topic}".
      
      Generate a Viral Strategy in ${langName}.
      
      CRITICAL: RETURN RAW JSON ONLY (Start with { and end with }). NO MARKDOWN.
      Structure:
      ${jsonStructure}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: config
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    throw error;
  }
};

export const getPublicChannelInfo = async (query: string, language: Language) => {
  if (!checkApiKey()) throw new Error("Missing API Key");
  
  try {
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `You are a YouTube Data Analyst.
          
          TASK: Use Google Search to find detailed information about the YouTube channel matching: "${query}".
          
          I need:
          1. Exact Channel Name
          2. Approximate Subscriber Count
          3. Total View Count (if available)
          4. Total Video Count (approx)
          5. 4 Most Recent or Popular Videos (Title, Views, Date, URL)
          
          Return RAW JSON ONLY (Start with { and end with }). NO MARKDOWN.
          {
              "name": "Channel Name",
              "subscriberCount": "1.5M",
              "viewCount": "250M",
              "videoCount": "450",
              "avatar": "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png", 
              "recentVideos": [
                  {
                      "title": "Video Title",
                      "views": "View count string",
                      "publishedAt": "e.g. 2 days ago",
                      "url": "https://youtube.com/...",
                      "thumbnail": "https://img.youtube.com/vi/[VIDEO_ID]/mqdefault.jpg"
                  }
              ]
          }
          
          Note: For thumbnails, try to construct the URL if you find the Video ID.
          `,
          config: {
              tools: [{ googleSearch: {} }]
          }
      });
      
      return response.text;
  } catch (error) {
      console.error("Gemini Channel Search Error:", error);
      throw error;
  }
};
