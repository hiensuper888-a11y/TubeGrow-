import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

// --- CONFIGURATION ---
const OPENAI_API_KEY = '';

// Helper to check API keys
export const checkApiKey = (): boolean => {
  // Check if we have at least one valid key to operate
  return !!process.env.API_KEY || !!OPENAI_API_KEY;
};

const getLangName = (lang: Language) => {
  switch (lang) {
    case 'vi': return 'Vietnamese';
    case 'zh': return 'Chinese (Simplified)';
    case 'ja': return 'Japanese';
    default: return 'English';
  }
};

// --- CLIENT HELPERS ---

const getGeminiClient = () => {
    if (!process.env.API_KEY) {
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- FALLBACK LOGIC ---

/**
 * Handles errors from OpenAI and attempts to use Gemini as a fallback.
 * If fallback fails or is unavailable, throws a descriptive error.
 */
const handleOpenAIFallback = async <T>(
    originalError: any, 
    fallbackAction: (ai: any) => Promise<T>
): Promise<T> => {
    const ai = getGeminiClient();
    const isQuotaError = originalError.message?.includes('quota') || originalError.message?.includes('billing');

    // If Gemini is not configured
    if (!ai) {
        if (isQuotaError) {
             throw new Error("OpenAI Quota Exceeded. Please check your plan and billing details at platform.openai.com, or configure a Gemini API Key in your environment.");
        }
        throw new Error(originalError.message || "OpenAI Service Unavailable and no Gemini API Key configured.");
    }

    // Try Fallback
    try {
        return await fallbackAction(ai);
    } catch (geminiError: any) {
        console.warn("Gemini Fallback Failed:", geminiError);
        // Prioritize the Quota error message if it exists, as it's more actionable for the user's primary config
        if (isQuotaError) {
             throw new Error("OpenAI Quota Exceeded and Gemini Fallback failed. Please check your API keys.");
        }
        throw new Error("AI Services Unavailable. Please try again later.");
    }
};

// --- OPENAI HELPERS ---

const callOpenAIChat = async (messages: any[], model: string = 'gpt-4o', jsonMode: boolean = false) => {
    if (!OPENAI_API_KEY) {
        throw new Error("OpenAI API Key is missing.");
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                response_format: jsonMode ? { type: "json_object" } : undefined
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'OpenAI API Error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.warn("OpenAI Chat Error (attempting fallback):", error);
        throw error;
    }
};

const callOpenAIImage = async (prompt: string) => {
    if (!OPENAI_API_KEY) {
        throw new Error("OpenAI API Key is missing.");
    }

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json"
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'OpenAI Image Error');
        }
        
        const data = await response.json();
        return data.data[0].b64_json;
    } catch (error) {
        console.warn("OpenAI Image Error (attempting fallback):", error);
        throw error;
    }
};

// --- UTILS ---
export const cleanAndParseJson = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      try { return JSON.parse(markdownMatch[1]); } catch (e2) {}
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
       try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)); } catch (e3) {}
    }
    return null;
  }
};

// --- FUNCTIONS ---

/**
 * OPTIMIZER: Try OpenAI -> Fallback Gemini
 */
export const generateVideoMetadata = async (topic: string, tone: string, language: Language) => {
  const langName = getLangName(language);
  const prompt = `You are a YouTube SEO Expert. Generate metadata for a video about "${topic}". Tone: ${tone}.
  IMPORTANT: The content MUST be generated in ${langName}.
  Return a JSON object with:
  1. 5 click-worthy, high CTR titles.
  2. A compelling video description (first 2 lines are hooks).
  3. 15 comma-separated tags.
  
  JSON Structure: { "titles": [], "description": "", "tags": "" }`;

  try {
    return await callOpenAIChat([{ role: 'user', content: prompt }], 'gpt-4o', true);
  } catch (e) {
    return handleOpenAIFallback(e, async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return response.text;
    });
  }
};

/**
 * SCRIPT WRITER: Try OpenAI -> Fallback Gemini
 */
export const generateScript = async (title: string, points: string, language: Language) => {
  const langName = getLangName(language);
  const prompt = `Write a full YouTube video script for the title: "${title}".
  Key points to cover: ${points}.
  IMPORTANT: Write the entire script in ${langName}.
  Structure: Hook (0-30s), Intro, Body, CTA, Outro.
  Use Markdown formatting. Make it engaging.`;

  try {
    return await callOpenAIChat([{ role: 'user', content: prompt }], 'gpt-4o');
  } catch (e) {
    return handleOpenAIFallback(e, async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt
        });
        return response.text;
    });
  }
};

/**
 * TREND HUNTER: Primary Gemini (for Search) -> Fallback OpenAI (Text only) -> Fallback Gemini (Text only)
 */
export const findTrends = async (niche: string, language: Language) => {
  const ai = getGeminiClient();
  const langName = getLangName(language);

  // 1. Try Gemini with Search Grounding
  if (ai) {
      try {
        const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Find the latest trending topics and news in the "${niche}" niche using Google Search.
        Identify 5 breakout trends that would make good YouTube videos right now.
        For each trend, suggest a video angle.
        IMPORTANT: Provide the response in ${langName}.
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
        console.warn("Gemini Search Error (trying OpenAI fallback):", error);
      }
  }

  // 2. Fallback to OpenAI (Brainstorming only)
  try {
      const fallbackText = await callOpenAIChat([{role: 'user', content: `Suggest 5 evergreen trending topics for "${niche}" in ${langName}.`}]);
      return { text: fallbackText, groundingMetadata: null };
  } catch (e: any) {
      // 3. Fallback to Gemini Basic (Brainstorming only)
      return handleOpenAIFallback(e, async (aiFallback) => {
           const response = await aiFallback.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Suggest 5 evergreen trending topics for "${niche}" in ${langName}.`
           });
           return { text: response.text, groundingMetadata: null };
      });
  }
};

/**
 * THUMBNAIL RATER: Primary Gemini (Multimodal) -> Fallback OpenAI Vision
 */
export const analyzeThumbnail = async (base64Image: string, mimeType: string, context: string, language: Language) => {
  const ai = getGeminiClient();
  const langName = getLangName(language);

  // 1. Try Gemini Vision
  if (ai) {
    try {
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
            { inlineData: { mimeType: mimeType, data: base64Image } },
            { text: `Analyze this YouTube thumbnail. Video Context: ${context || 'General YouTube Video'}. 
                IMPORTANT: Provide the analysis in ${langName}.
                Provide: CTR Score (1-10), 3 Strengths, 3 Weaknesses, and Actionable advice.` }
            ]
        }
        });
        return response.text;
    } catch (error) {
        console.warn("Gemini Vision failed, trying OpenAI...", error);
    }
  }

  // 2. Try OpenAI Vision
  try {
     const messages = [{
          role: "user",
          content: [
              { type: "text", text: `Analyze this thumbnail. Context: ${context}. Language: ${langName}. Give Score, Strengths, Weaknesses.` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
      }];
      return await callOpenAIChat(messages, 'gpt-4o');
  } catch (e: any) {
      if (e.message?.includes('quota')) {
          throw new Error("OpenAI Quota Exceeded (Fallback Failed). Please check billing details.");
      }
      throw new Error("Analysis failed on both Gemini and OpenAI.");
  }
};

/**
 * VIDEO AUDIT: Primary Gemini (Search) -> Fallback OpenAI (Inference)
 */
export const auditVideo = async (url: string, language: Language) => {
  const ai = getGeminiClient();
  const langName = getLangName(language);

  // 1. Try Gemini with Search
  if (ai) {
    try {
        if (!url.includes('youtu')) throw new Error("Invalid URL");

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
        
        return {
            text: response.text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
        };
    } catch (error) {
        console.warn("Gemini Audit Error:", error);
    }
  }

  // 2. Fallback: Use OpenAI (Text inference)
  try {
    const fallbackText = await callOpenAIChat([{
        role: 'user', 
        content: `I have a video URL: ${url}. Since you can't browse, infer the likely topic and give generic advice for this type of video in ${langName}. Return JSON format.`
    }], 'gpt-4o', true);
    return { text: fallbackText, groundingMetadata: null };
  } catch (e) {
     // 3. Fallback: Gemini Text Inference
     return handleOpenAIFallback(e, async (aiFallback) => {
        const fallbackText = await aiFallback.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: `I have a video URL: ${url}. Since you can't browse, infer the likely topic and give generic advice for this type of video in ${langName}. Return JSON format { "videoTitle": "Unknown", "score": 50, "summary": "...", "positives": [], "negatives": [], "suggestions": [] }.`
        });
        return { text: fallbackText.text, groundingMetadata: null };
     });
  }
};

/**
 * THUMBNAIL MAKER: Try OpenAI DALL-E 3 -> Fallback Gemini Image Gen
 */
export const generateThumbnailImage = async (prompt: string, aspectRatio: string = "16:9") => {
  const fullPrompt = `YouTube Thumbnail, High CTR, ${aspectRatio} aspect ratio style. ${prompt}`;
  
  try {
    const b64Json = await callOpenAIImage(fullPrompt);
    return `data:image/png;base64,${b64Json}`;
  } catch (e) {
    // Fallback to Gemini Image Generation
    return handleOpenAIFallback(e, async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: fullPrompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any
                }
            }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Gemini generation successful but no image data found.");
    });
  }
};

/**
 * VIRAL STRATEGY: Try OpenAI -> Fallback Gemini
 */
export const generateViralStrategy = async (topic: string, language: Language) => {
  const langName = getLangName(language);
  const isUrl = topic.toLowerCase().includes('youtube.com') || topic.toLowerCase().includes('youtu.be');
  
  let trendContext = "";
  const ai = getGeminiClient();

  // Research Phase (Always try Gemini if possible, as OpenAI can't browse)
  if (isUrl && ai) {
      try {
          const research = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: `Research this video: ${topic}. What is the title, channel, and why is it successful?`,
              config: { tools: [{ googleSearch: {} }] }
          });
          trendContext = research.text || "";
      } catch (e) {
          console.warn("Gemini research failed");
      }
  }

  const prompt = `You are a World-Class YouTube Strategist. 
  Topic/Input: "${topic}".
  ${trendContext ? `Context from Search: ${trendContext}` : ''}
  
  Generate a Viral Strategy in ${langName}.
  
  Return RAW JSON ONLY. Structure:
  {
    "originalChannel": "N/A",
    "strategyTitle": "Viral Strategy Title",
    "trendContext": "Why is this relevant?",
    "analysis": {
      "strengths": ["S1", "S2"],
      "weaknesses": ["W1", "W2"]
    },
    "targetAudience": "Audience Description",
    "metadata": {
      "titleOptions": ["T1", "T2"],
      "description": "Desc",
      "tags": ["tag1", "tag2"]
    },
    "thumbnailIdea": {
      "visualDescription": "Detailed visual description for AI generator",
      "textOverlay": "Text on thumbnail"
    },
    "scriptOutline": {
      "hook": "Hook",
      "contentBeats": ["B1", "B2"],
      "cta": "CTA"
    },
    "promotionPlan": ["P1", "P2"]
  }`;

  try {
      // 1. Try OpenAI
      const content = await callOpenAIChat([{ role: 'user', content: prompt }], 'gpt-4o', true);
      return { text: content, groundingMetadata: null };
  } catch (e) {
      // 2. Fallback to Gemini using Helper
      return handleOpenAIFallback(e, async (aiFallback) => {
          const response = await aiFallback.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: prompt,
              config: {
                  responseMimeType: 'application/json'
              }
          });
          return { text: response.text, groundingMetadata: null };
      });
  }
};

/**
 * CHANNEL INFO: Primary Gemini (Search) -> Fallback OpenAI Template
 */
export const getPublicChannelInfo = async (query: string, language: Language) => {
  const ai = getGeminiClient();
  const prompt = `You are a YouTube Data Analyst.
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
          `;

  // 1. Try Gemini
  if (ai) {
      try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        return response.text;
      } catch (error) {
        console.warn("Gemini Channel Search Error:", error);
      }
  }

  // 2. Fallback OpenAI
  try {
      return await callOpenAIChat([{role: 'user', content: `Generate a JSON template for YouTube channel info for query "${query}".`}]);
  } catch(e) {
      // 3. Fallback Gemini Basic
      return handleOpenAIFallback(e, async (aiFallback) => {
          const response = await aiFallback.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: `Generate a JSON template for YouTube channel info for query "${query}".`
          });
          return response.text;
      });
  }
};