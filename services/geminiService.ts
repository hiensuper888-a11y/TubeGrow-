import { GoogleGenAI, Modality } from "@google/genai";
import { Language } from "../types";

// --- KEY MANAGEMENT ---

export const getApiKey = () => {
  // User instruction: Bonsai key includes Gemini.
  return localStorage.getItem(`tubegrow_bonsai_key`) || 'sk_cr_9TxTcembyRp6oEC5VrDNpsQeGZLK6u2z1T7zfcDcwvaQ';
};

export const setApiKey = (key: string) => {
  localStorage.setItem(`tubegrow_bonsai_key`, key.trim());
};

// Helper to check if API key is available
export const checkApiKey = (): boolean => {
  return !!getApiKey();
};

const getLangName = (lang: Language) => {
  switch (lang) {
    case 'vi': return 'Vietnamese';
    case 'zh': return 'Chinese (Simplified)';
    case 'ja': return 'Japanese';
    default: return 'English';
  }
};

// --- ERROR HANDLING ---

const getFriendlyError = (error: any) => {
  let msg = error.message || String(error);

  // Attempt to parse JSON-like error messages often returned by SDKs
  if (msg.includes('{') && msg.includes('}')) {
     try {
         // Extract JSON part if mixed with text
         const jsonMatch = msg.match(/({[\s\S]*})/);
         if (jsonMatch) {
             const errorObj = JSON.parse(jsonMatch[0]);
             if (errorObj.error?.message) msg = errorObj.error.message;
         }
     } catch (e) {}
  }

  // Common Gemini Error Codes
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return `Gemini Quota Exceeded. The free tier limit has been reached. Please wait a moment or use a paid API Key.`;
  }
  if (msg.includes('503') || msg.includes('Overloaded')) {
      return `Gemini Server Overloaded. Please try again later.`;
  }
  if (msg.includes('SAFETY') || msg.includes('BLOCKED')) {
      return `Gemini blocked this content. Please modify your prompt.`;
  }
  if (msg.includes('401') || msg.includes('API key not valid')) {
      return `Invalid API Key. Please check your Bonsai/Gemini settings.`;
  }

  return `AI Error: ${msg}`;
};


// --- CLIENT HELPERS ---

const getGeminiClient = () => {
    const key = getApiKey();
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
};

// --- HELPER: AUDIO DECODING ---
export const decodePCMData = (base64String: string, audioContext: AudioContext) => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const frameCount = dataInt16.length / numChannels;
  
  const buffer = audioContext.createBuffer(numChannels, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
};


// --- MOCK DATA GENERATORS (DEMO MODE) ---
const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- CORE GENERATION FUNCTION ---

const callGemini = async (
    systemPrompt: string, 
    userPrompt: string, 
    model: string = 'gemini-3-flash-preview',
    jsonMode: boolean = false
) => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("API Key not configured.");

    try {
        const response = await ai.models.generateContent({
            model: model,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: jsonMode ? 'application/json' : 'text/plain'
            },
            contents: userPrompt
        });
        return response.text;
    } catch (e: any) {
        console.warn("AI Failed:", e);
        throw new Error(getFriendlyError(e));
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
 * OPTIMIZER
 */
export const generateVideoMetadata = async (topic: string, tone: string, language: Language) => {
  if (!checkApiKey()) {
      await mockDelay(1500);
      return JSON.stringify({
          titles: [`[DEMO] Guide to ${topic}`, `[DEMO] ${topic} Secrets`],
          description: `(DEMO MODE) Description for ${topic}.`,
          tags: `${topic}, demo, ai`
      });
  }

  const langName = getLangName(language);
  const systemPrompt = `YouTube SEO Expert. Tone: ${tone}. Language: ${langName}.`;
  const userPrompt = `Generate metadata for: "${topic}". JSON: { "titles": [], "description": "", "tags": "" }`;

  return await callGemini(systemPrompt, userPrompt, 'gemini-3-flash-preview', true);
};

/**
 * SCRIPT WRITER
 */
export const generateScript = async (title: string, points: string, language: Language) => {
  if (!checkApiKey()) {
      await mockDelay(2000);
      return `# [DEMO] Script: ${title}\n\n(Add API Key for real AI scripts).`;
  }

  const ai = getGeminiClient();
  const langName = getLangName(language);
  
  // Try Thinking Mode first
  if (ai) {
      try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Write a deep, engaging YouTube script for "${title}". Key points: ${points}. Language: ${langName}.`,
            config: {
                thinkingConfig: { thinkingBudget: 16000 } // Reduced budget to avoid hitting quota too fast
            }
        });
        return response.text;
      } catch (e) {
        console.warn("Thinking Mode failed, falling back to standard...", e);
      }
  }

  const systemPrompt = `Professional Scriptwriter. Language: ${langName}.`;
  const userPrompt = `Title: "${title}". Points: ${points}.`;
  return await callGemini(systemPrompt, userPrompt, 'gemini-3-pro-preview', false);
};

/**
 * TREND HUNTER
 */
export const findTrends = async (niche: string, language: Language) => {
  if (!checkApiKey()) {
      await mockDelay(1500);
      return { text: `## [DEMO] Trending in ${niche}\n\n1. AI\n2. Shorts`, groundingMetadata: null };
  }

  const ai = getGeminiClient();
  const langName = getLangName(language);

  if (ai) {
      try {
        const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Find latest trending topics in "${niche}". Language: ${langName}. Format: Markdown list with source links.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
        });
        
        return {
           text: response.text,
           groundingMetadata: response.candidates?.[0]?.groundingMetadata
        };
      } catch (error: any) {
        console.warn("Search Error:", error);
        throw new Error(getFriendlyError(error));
      }
  }
  throw new Error("Client Init Failed");
};

/**
 * THUMBNAIL RATER
 */
export const analyzeThumbnail = async (base64Image: string, mimeType: string, context: string, language: Language) => {
  if (!checkApiKey()) {
      await mockDelay(2000);
      return `## [DEMO] Analysis\nScore: 8/10`;
  }

  const ai = getGeminiClient();
  const langName = getLangName(language);
  const promptText = `Analyze thumbnail. Context: ${context || 'General'}. Lang: ${langName}. Provide CTR Score (1-10), Strengths, Weaknesses.`;

  if (ai) {
    try {
        const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
            { inlineData: { mimeType: mimeType, data: base64Image } },
            { text: promptText }
            ]
        }
        });
        return response.text;
    } catch (error: any) {
        console.warn("Vision failed", error);
        throw new Error(getFriendlyError(error));
    }
  }
  throw new Error("Client Init Failed");
};

/**
 * VIDEO ANALYZER (UPLOAD)
 */
export const analyzeUploadedVideo = async (base64Data: string, mimeType: string, prompt: string, language: Language) => {
    if (!checkApiKey()) {
        await mockDelay(2000);
        return `## [DEMO] Analysis\n(Demo Mode) This video appears to be interesting...`;
    }

    const ai = getGeminiClient();
    const langName = getLangName(language);
    
    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType, data: base64Data } },
                        { text: `${prompt}. Language: ${langName}.` }
                    ]
                }
            });
            return response.text;
        } catch (e: any) {
            console.error("Video Analysis Error:", e);
            throw new Error(getFriendlyError(e));
        }
    }
    
    throw new Error("API Key required for video analysis.");
};

/**
 * VIDEO AUDIT
 */
export const auditVideo = async (url: string, language: Language) => {
  if (!checkApiKey()) {
      await mockDelay(2000);
      return { text: JSON.stringify({ videoTitle: "[DEMO]", score: 75, summary: "Demo", positives: [], negatives: [], suggestions: [] }), groundingMetadata: null };
  }

  const ai = getGeminiClient();
  const langName = getLangName(language);

  if (ai) {
    try {
        const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze YouTube video: ${url}. Use Search. Lang: ${langName}. JSON format.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
        });
        return { text: response.text, groundingMetadata: response.candidates?.[0]?.groundingMetadata };
    } catch (error: any) {
        console.warn("Audit Error:", error);
        throw new Error(getFriendlyError(error));
    }
  }
  throw new Error("Client Init Failed");
};

/**
 * THUMBNAIL MAKER
 */
export const generateThumbnailImage = async (prompt: string, aspectRatio: string = "16:9", quality: 'standard' | 'hd' = 'standard') => {
  if (!checkApiKey()) return `https://placehold.co/1280x720/1a1a1a/FFF?text=DEMO+AI`;

  const ai = getGeminiClient();
  
  let model = 'gemini-2.5-flash-image';
  if (quality === 'hd') {
      model = 'gemini-3-pro-image-preview';
  }

  if (ai) {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: `YouTube Thumbnail: ${prompt}` }] },
            config: { 
                imageConfig: { 
                    aspectRatio: aspectRatio as any,
                } 
            }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    } catch (e: any) {
        console.warn("Image Gen failed:", e);
        throw new Error(getFriendlyError(e));
    }
  }
  throw new Error("Image generation failed.");
};

/**
 * VIRAL STRATEGY (ADVANCED)
 */
export const generateViralStrategy = async (topic: string, language: Language) => {
   if (!checkApiKey()) {
      await mockDelay(2500);
      return { text: JSON.stringify({ strategyTitle: "[DEMO] Strategy" }), groundingMetadata: null };
   }

   const langName = getLangName(language);
   const ai = getGeminiClient();

   if (!ai) throw new Error("Init Failed");

   const systemPrompt = `You are a World-Class YouTube Strategist (MrBeast level).
   Analyze the input topic/URL and provide a MASTERCLASS detailed strategy in JSON format.
   Language: ${langName}.
   
   Output JSON Structure (Strict):
   {
      "strategyTitle": "A click-worthy title for this strategy report",
      "targetAudience": {
         "persona": "Detailed viewer persona (age, interests)",
         "painPoints": ["pain1", "pain2"],
         "desires": ["desire1", "desire2"]
      },
      "competitorGap": "What are competitors missing that this video will exploit?",
      "hooks": [
         { "type": "Curiosity", "script": "Hook script 1...", "why": "Explanation" },
         { "type": "Story", "script": "Hook script 2...", "why": "Explanation" },
         { "type": "Controversial", "script": "Hook script 3...", "why": "Explanation" }
      ],
      "thumbnailStrategy": {
         "visualDescription": "Detailed image prompt for AI generation",
         "textOverlay": "Short text on image",
         "colorPsychology": "Why use these colors",
         "layout": "Composition details (e.g. Rule of thirds, Facial expression)"
      },
      "metadata": {
         "titleOptions": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
         "description": "SEO optimized description",
         "tags": ["tag1", "tag2"]
      },
      "scriptStructure": {
         "intro": "The Setup (0-30s)",
         "risingAction": "Building value/tension",
         "climax": "The Payoff/Key Insight",
         "cta": "Engagement trigger"
      },
      "engagementTriggers": {
         "pinnedComment": "Text for a pinned comment to start debate",
         "inVideoQuestion": "Specific question to ask viewers"
      },
      "launchPlan": ["Step 1 (Pre-publish)", "Step 2 (First hour)", "Step 3 (24h later)", "Step 4 (Community tab)"]
   }`;

   try {
     const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a Viral Strategy for: "${topic}".`,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 8000 }
        }
     });
     return { text: response.text, groundingMetadata: null };
   } catch (e: any) {
     console.warn("Strategy Gen - Thinking failed, fallback to standard", e);
     return { text: await callGemini(systemPrompt, `Strategy for "${topic}"`, 'gemini-3-flash-preview', true), groundingMetadata: null };
   }
};

export const getPublicChannelInfo = async (query: string, language: Language) => {
  if (!checkApiKey()) return JSON.stringify({ name: "[DEMO] " + query });
  const ai = getGeminiClient();
  if (ai) {
      try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Find channel info: "${query}". JSON format.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text;
      } catch (error) {}
  }
  return await callGemini("Analyst", `Channel info "${query}". JSON.`, 'gemini-3-flash-preview', true);
};

// --- NEW FEATURES ---

/**
 * VEO VIDEO GENERATION
 */
export const generateVeoVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("API Key Required for Veo");

    try {
        console.log("Starting Veo Generation...");
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("No video URI returned");

        const apiKey = getApiKey();
        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!videoResponse.ok) throw new Error("Failed to download video bytes");
        
        const blob = await videoResponse.blob();
        return URL.createObjectURL(blob);

    } catch (e: any) {
        console.error("Veo Error:", e);
        throw new Error(getFriendlyError(e));
    }
};

/**
 * TEXT TO SPEECH
 */
export const generateSpeech = async (text: string, voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' = 'Kore') => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("API Key Required for TTS");
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");
        return base64Audio;
    } catch (e: any) {
        throw new Error(getFriendlyError(e));
    }
};

/**
 * AUDIO TRANSCRIPTION
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("API Key Required");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Audio } },
                    { text: "Transcribe this audio accurately." }
                ]
            }
        });
        return response.text;
    } catch (e: any) {
        throw new Error(getFriendlyError(e));
    }
};

/**
 * CHATBOT STREAMING
 */
export const createChatSession = (systemInstruction: string) => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("API Key Required");
    
    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: { systemInstruction }
    });
};