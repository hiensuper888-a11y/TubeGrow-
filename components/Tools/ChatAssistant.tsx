import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatAssistant: React.FC = () => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hello! I am your TubeGrow Assistant powered by Gemini 3 Pro. Ask me anything about YouTube growth, SEO, or content ideas!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSession = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    try {
        chatSession.current = createChatSession(`You are an expert YouTube Strategist. Answer in ${language === 'vi' ? 'Vietnamese' : 'English'}. Be helpful, concise, and professional.`);
    } catch (e) {
        setMessages([{ role: 'model', text: "Error: Please configure your Gemini API Key in Settings to use the chatbot." }]);
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
        // Stream the response
        const result = await chatSession.current.sendMessageStream({ message: userMsg });
        
        let fullResponse = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]); // Add placeholder

        for await (const chunk of result) {
            const text = chunk.text(); // Note: SDK might expose .text() or .text property
            fullResponse += text;
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].text = fullResponse;
                return newMsgs;
            });
        }
    } catch (e: any) {
        setMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}` }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <h2 className="text-3xl font-bold mb-4 flex items-center gap-2 flex-none">
        <Sparkles className="text-blue-500" /> Chat Assistant
      </h2>

      <div className="flex-1 bg-neutral-900/50 rounded-2xl border border-white/5 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
        {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'model' ? 'bg-blue-600' : 'bg-neutral-700'}`}>
                    {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${msg.role === 'model' ? 'bg-neutral-800 text-gray-200' : 'bg-blue-600 text-white'}`}>
                    {msg.role === 'model' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                    ) : (
                        msg.text
                    )}
                </div>
            </div>
        ))}
        {loading && (
             <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                     <Bot size={18} />
                 </div>
                 <div className="bg-neutral-800 rounded-2xl p-4 flex items-center">
                     <div className="flex gap-1">
                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                     </div>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-none mt-4 flex gap-2">
        <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for ideas, scripts, or analysis..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            disabled={loading}
        />
        <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl disabled:opacity-50 transition-colors"
        >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;