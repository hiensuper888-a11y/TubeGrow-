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

// --- ERROR HANDLING ---

const getFriendlyError = (error: any, provider: string = 'AI') => {
  let msg = error.message || String(error);

  if (msg.includes('{') && msg.includes('}')) {
     try {
         const jsonMatch = msg.match(/({[\s\S]*})/);
         if (jsonMatch) {
             const errorObj = JSON.parse(jsonMatch[0]);
             if (errorObj.error?.message) msg = errorObj.error.message;
         }
     } catch (e) {}
  }

  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return `${provider} Quota Exceeded. The free tier limit may have been reached. Please use a paid API Key or wait.`;
  }
  if (msg.includes('503') || msg.includes('Overloaded')) {
      return `${provider} Server Overloaded. Please try again later.`;
  }
  if (msg.includes('SAFETY') || msg.includes('BLOCKED')) {
      return `${provider} content blocked. Please modify your prompt.`;
  }
  if (msg.includes('401') || msg.includes('API key not valid')) {
      return `Invalid ${provider} API Key. Please check your settings.`;
  }

  return `${provider} Error: ${msg}`;
};


// --- CLIENT HELPERS ---

const getGeminiClient = () => {
    const key = getApiKey('gemini');
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

// --- API CALLERS ---

// OpenAI (ChatGPT)
const callOpenAIChat = async (messages: any[], model: string = 'gpt-4o', jsonMode: boolean = false) => {
    const key = getApiKey('openai');
    if (!key) throw new Error("OpenAI Key missing");

    try {
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
    } catch (e: any) {
        throw new Error(getFriendlyError(e, 'OpenAI'));
    }
};

// OpenAI Image (DALL-E)
const callOpenAIImage = async (prompt: string) => {
    const key = getApiKey('openai');
    if (!key) throw new Error("OpenAI Key missing");

    try {
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
    } catch (e: any) {
        throw new Error(getFriendlyError(e, 'OpenAI DALL-E'));
    }
};

// Grok (xAI)
const callGrokChat = async (messages: any[], model: string = 'grok-beta') => {
    const key = getApiKey('grok');
    if (!key) throw new Error("Grok Key missing");

    try {
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
    } catch (e: any) {
        throw new Error(getFriendlyError(e, 'Grok'));
    }
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
        errors.push(e.message);
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
        errors.push(e.message);
    }

    // 3. Try Gemini (ĐÃ FIX: Dùng systemInstruction chuẩn)
    const ai = getGeminiClient();
    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: fallbackModelGemini,
                contents: userPrompt,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: jsonMode ? 'application/json' : 'text/plain'
                }
            });
            return response.text;
        } catch (e: any) {
            console.warn("Gemini Failed:", e);
            errors.push(getFriendlyError(e, 'Gemini'));
        }
    } else {
        errors.push("Gemini: Key not configured");
    }

    throw new Error("All AI services failed.\n" + errors.join('\n'));
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

  return await smartChatGen(systemPrompt, userPrompt, 'gemini-2.5-flash-preview', true);
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
  
  if (ai) {
      try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Write a deep, engaging YouTube script for "${title}". Key points: ${points}. Language: ${langName}.`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 } 
            }
        });
        return response.text;
      } catch (e) {
        console.warn("Gemini Thinking Mode failed, falling back...", e);
        if(String(e).includes('429')) throw new Error(getFriendlyError(e, 'Gemini'));
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
      } catch (error: any) {
        console.warn("Gemini Search Error:", error);
        if (error.message.includes('429')) throw new Error(getFriendlyError(error, 'Gemini'));
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
        // ĐÃ FIX: Truyền mảng trực tiếp, không bọc trong Object { parts: [] }
        const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            { inlineData: { mimeType: mimeType, data: base64Image } },
            { text: promptText }
        ]
        });
        return response.text;
    } catch (error: any) {
        console.warn("Gemini Vision failed", error);
        if (error.message.includes('429')) throw new Error(getFriendlyError(error, 'Gemini'));
    }
  }
  
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
            // ĐÃ FIX: Truyền mảng trực tiếp
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: `${prompt}. Language: ${langName}.` }
                ]
            });
            return response.text;
        } catch (e: any) {
            console.error("Video Analysis Error:", e);
            throw new Error(getFriendlyError(e, 'Gemini'));
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
    } catch (error: any) {
        console.warn("Gemini Audit Error:", error);
        if (error.message.includes('429')) throw new Error(getFriendlyError(error, 'Gemini'));
    }
  }

  const systemPrompt = `YouTube Expert. Lang: ${langName}.`;
  const userPrompt = `Analyze URL: ${url}. JSON format.`;
  const text = await smartChatGen(systemPrompt, userPrompt, 'gemini-3-flash-preview', true);
  return { text, groundingMetadata: null };
};

/**
 * THUMBNAIL MAKER
 */
export const generateThumbnailImage = async (prompt: string, aspectRatio: string = "16:9", quality: 'standard' | 'hd' = 'standard') => {
  if (!checkApiKey()) return `https://placehold.co/1280x720/1a1a1a/FFF?text=DEMO+AI`;

  const ai = getGeminiClient();
  
  // Model ảnh của Google thường dùng tiền tố imagen
  let model = 'imagen-3.0-generate-002';

  if (ai) {
    try {
        // ĐÃ FIX: Sử dụng hàm generateImages thay vì generateContent
        const response = await ai.models.generateImages({
            model: model,
            prompt: `YouTube Thumbnail: ${prompt}`,
            config: { 
                aspectRatio: aspectRatio as any,
                outputMimeType: "image/png"
            }
        });
        
        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
             return `data:image/png;base64,${imageBytes}`;
        }
    } catch (e: any) {
        console.warn("Gemini Image Gen failed:", e);
        if (e.message.includes('429')) throw new Error(getFriendlyError(e, 'Gemini'));
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
   if (!checkApiKey()) {
      await mockDelay(2500);
      return { text: JSON.stringify({ strategyTitle: "[DEMO] Strategy" }), groundingMetadata: null };
   }
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

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation.name || operation }); // Fix fallback name
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("No video URI returned");

        const apiKey = getApiKey('gemini');
        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!videoResponse.ok) throw new Error("Failed to download video bytes");
        
        const blob = await videoResponse.blob();
        return URL.createObjectURL(blob);

    } catch (e: any) {
        console.error("Veo Error:", e);
        throw new Error(getFriendlyError(e, 'Veo'));
    }
};

/**
 * TEXT TO SPEECH
 */
export const generateSpeech = async (text: string, voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' = 'Kore') => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("Gemini API Key Required for TTS");
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ text: text }], // ĐÃ FIX: Chỉ cần mảng chứa text
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
        throw new Error(getFriendlyError(e, 'Gemini TTS'));
    }
};

/**
 * AUDIO TRANSCRIPTION
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    const ai = getGeminiClient();
    if (!ai) throw new Error("Gemini API Key Required");

    try {
        // ĐÃ FIX: Truyền mảng trực tiếp cho Audio
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                { inlineData: { mimeType: mimeType, data: base64Audio } },
                { text: "Transcribe this audio accurately." }
            ]
        });
        return response.text;
    } catch (e: any) {
        throw new Error(getFriendlyError(e, 'Gemini Transcription'));
    }
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
