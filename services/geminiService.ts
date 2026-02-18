import { GoogleGenAI, Modality } from "@google/genai";
import { Language } from "../types";

// --- KEY MANAGEMENT ---

export const getApiKey = (provider: 'gemini' | 'openai' | 'grok') => {
  return localStorage.getItem(`tubegrow_${provider}_key`) || '';
};

export const setApiKey = (provider: 'gemini' | 'openai' | 'grok', key: string) => {
  localStorage.setItem(`tubegrow_${provider}_key`, key.trim());
};

// Helper to check if ANY AI service is available
export const checkApiKey = (): boolean => {
  // STRICTLY User provided keys only. No process.env fallback.
  return !!getApiKey('gemini') || !!getApiKey('openai') || !!getApiKey('grok');
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
    const key = getApiKey('gemini');
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
};

// --- HELPER: AUDIO DECODING ---
// Helper to decode base64 raw PCM audio (16-bit, 24kHz) from Gemini TTS
export const decodePCMData = (base64String: string, audioContext: AudioContext) => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Convert Uint8Array bytes (representing Int16) to Float32
  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const frameCount = dataInt16.length / numChannels;
  
  // Create buffer (standard sample rate for Gemini TTS is 24000)
  const buffer = audioContext.createBuffer(numChannels, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    // Normalize Int16 to Float32 [-1.0, 1.0]
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
};


// --- MOCK DATA GENERATORS (DEMO MODE) ---
const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API CALLERS ---

// OpenAI (ChatGPT)
const callOpenAIChat = async (messages: any[], model: string = 'gpt-4o', jsonMode: boolean = false) => {
    const key = getApiKey('openai');
    if (!key) throw new Error("OpenAI Key missing");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
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
};

// OpenAI Image (DALL-E)
const callOpenAIImage = async (prompt: string) => {
    const key = getApiKey('openai');
    if (!key) throw new Error("OpenAI Key missing");

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
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
};

// Grok (xAI)
const callGrokChat = async (messages: any[], model: string = 'grok-beta') => {
    const key = getApiKey('grok');
    if (!key) throw new Error("Grok Key missing");

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            stream: false
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Grok API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

// --- SMART ROUTER ---

const smartChatGen = async (
    systemPrompt: string, 
    userPrompt: string, 
    fallbackModelGemini: string = 'gemini-3-flash-preview',
    jsonMode: boolean = false
) => {
    const errors: string[] = [];
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    // 1. Try OpenAI
    try {
        if (getApiKey('openai')) {
            return await callOpenAIChat(messages, 'gpt-4o', jsonMode);
        }
    } catch (e: any) {
        console.warn("OpenAI Failed:", e);
        errors.push(`OpenAI: ${e.message}`);
    }

    // 2. Try Grok
    try {
        if (getApiKey('grok')) {
            const content = await callGrokChat(messages, 'grok-beta');
            if (jsonMode && content) {
                 const json = cleanAndParseJson(content);
                 return json ? JSON.stringify(json) : content;
            }
            return content;
        }
    } catch (e: any) {
        console.warn("Grok Failed:", e);
        errors.push(`Grok: ${e.message}`);
    }

    // 3. Try Gemini
    const ai = getGeminiClient();
    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: fallbackModelGemini,
                contents: `${systemPrompt}\n\nUser Task: ${userPrompt}`,
                config: {
                    responseMimeType: jsonMode ? 'application/json' : 'text/plain'
                }
            });
            return response.text;
        } catch (e: any) {
            console.warn("Gemini Failed:", e);
            errors.push(`Gemini: ${e.message}`);
        }
    } else {
        errors.push("Gemini: Key not configured");
    }

    throw new Error("All AI services failed. Please check your API Keys in Settings.\n" + errors.join('\n'));
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
 * OPTIMIZER: Uses "Fast AI" (Flash Lite) for low latency
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

  // Use Flash-Lite for speed as requested
  return await smartChatGen(systemPrompt, userPrompt, 'gemini-2.5-flash-lite-preview', true);
};

/**
 * SCRIPT WRITER: Uses "Thinking Mode" with Gemini 3 Pro
 */
export const generateScript = async (title: string, points: string, language: Language) => {
  if (!checkApiKey()) {
      await mockDelay(2000);
      return `# [DEMO] Script: ${title}\n\n(Add API Key for real AI scripts).`;
  }

  const ai = getGeminiClient();
  const langName = getLangName(language);
  
  // If Gemini is available, use Thinking Mode
  if (ai) {
      try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Write a deep, engaging YouTube script for "${title}". Key points: ${points}. Language: ${langName}.`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 } // Max thinking budget
            }
        });
        return response.text;
      } catch (e) {
        console.warn("Gemini Thinking Mode failed, falling back...", e);
      }
  }

  const systemPrompt = `Professional Scriptwriter. Language: ${langName}.`;
  const userPrompt = `Title: "${title}". Points: ${points}.`;
  return await smartChatGen(systemPrompt, userPrompt, 'gemini-3-pro-preview', false);
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
      } catch (error) {
        console.warn("Gemini Search Error:", error);
      }
  }

  const systemPrompt = `Trend Analyst. Language: ${langName}.`;
  const userPrompt = `Suggest 5 trends for "${niche}".`;
  const text = await smartChatGen(systemPrompt, userPrompt, 'gemini-3-flash-preview', false);
  return { text, groundingMetadata: null };
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
        // Use Pro for deep image analysis
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
    } catch (error) {
        console.warn("Gemini Vision failed", error);
    }
  }
  // Fallback to OpenAI if Gemini fails
  if (getApiKey('openai')) {
      try {
        const messages = [{
            role: "user",
            content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
        }];
        return await callOpenAIChat(messages, 'gpt-4o');
      } catch (e: any) {}
  }

  throw new Error("Analysis failed.");
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
            throw new Error(e.message || "Failed to analyze video.");
        }
    }
    
    throw new Error("Gemini API Key required for video analysis.");
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
    } catch (error) {
        console.warn("Gemini Audit Error:", error);
    }
  }

  const systemPrompt = `YouTube Expert. Lang: ${langName}.`;
  const userPrompt = `Analyze URL: ${url}. JSON format.`;
  const text = await smartChatGen(systemPrompt, userPrompt, 'gemini-3-flash-preview', true);
  return { text, groundingMetadata: null };
};

/**
 * THUMBNAIL MAKER
 * Supported models: 'gemini-3-pro-image-preview' (High Quality), 'gemini-2.5-flash-image' (Fast/Nano Banana)
 */
export const generateThumbnailImage = async (prompt: string, aspectRatio: string = "16:9", quality: 'standard' | 'hd' = 'standard') => {
  if (!checkApiKey()) return `https://placehold.co/1280x720/1a1a1a/FFF?text=DEMO+AI`;

  const ai = getGeminiClient();
  
  // Default to High Quality Pro model if requested
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
                    // imageSize: quality === 'hd' ? '2K' : undefined // Only for pro model, but let's keep it simple
                } 
            }
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    } catch (e) {
        console.warn("Gemini Image Gen failed:", e);
    }
  }
  
  // Fallback OpenAI
  if (getApiKey('openai')) {
      try {
        const b64Json = await callOpenAIImage(`YouTube Thumbnail ${aspectRatio}: ${prompt}`);
        return `data:image/png;base64,${b64Json}`;
      } catch (e) {}
  }

  throw new Error("Image generation failed.");
};

/**
 * VIRAL STRATEGY
 */
export const generateViralStrategy = async (topic: string, language: Language) => {
   // (Existing implementation kept for brevity, similar structure to Audit/Script)
   if (!checkApiKey()) {
      await mockDelay(2500);
      return { text: JSON.stringify({ strategyTitle: "[DEMO] Strategy" }), groundingMetadata: null };
   }
   // ... implementation same as before ...
   const systemPrompt = `YouTube Strategist. Lang: ${getLangName(language)}.`;
   const userPrompt = `Strategy for "${topic}". JSON format.`;
   const text = await smartChatGen(systemPrompt, userPrompt, 'gemini-3-pro-preview', true);
   return { text, groundingMetadata: null };
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
  return await smartChatGen("Analyst", `Channel info "${query}". JSON.`, 'gemini-3-flash-preview', true);
};

// --- NEW FEATURES ---

/**
 * VEO VIDEO GENERATION
 * model: veo-3.1-fast-generate-preview
 */
export const generateVeoVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("Gemini API Key Required for Veo");

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

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            console.log("Polling Veo status...");
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("No video URI returned");

        // Fetch the actual video bytes using the API Key
        const apiKey = getApiKey('gemini');
        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!videoResponse.ok) throw new Error("Failed to download video bytes");
        
        const blob = await videoResponse.blob();
        return URL.createObjectURL(blob);

    } catch (e: any) {
        console.error("Veo Error:", e);
        throw new Error(e.message || "Video generation failed");
    }
};

/**
 * TEXT TO SPEECH
 * model: gemini-2.5-flash-preview-tts
 */
export const generateSpeech = async (text: string, voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' = 'Kore') => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("Gemini API Key Required for TTS");

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
};

/**
 * AUDIO TRANSCRIPTION
 * model: gemini-3-flash-preview
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("Gemini API Key Required");

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
};

/**
 * CHATBOT STREAMING
 */
export const createChatSession = (systemInstruction: string) => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("Gemini Key Required");
    
    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: { systemInstruction }
    });
};