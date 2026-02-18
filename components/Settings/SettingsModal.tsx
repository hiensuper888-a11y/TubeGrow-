import React, { useState, useEffect } from 'react';
import { X, Save, Key, ExternalLink, Zap, MessageSquare, Bot } from 'lucide-react';
import { getApiKey, setApiKey } from '../../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [grokKey, setGrokKey] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(getApiKey('gemini'));
      setOpenaiKey(getApiKey('openai'));
      setGrokKey(getApiKey('grok'));
      setStatus('');
    }
  }, [isOpen]);

  const handleSave = () => {
    setApiKey('gemini', geminiKey);
    setApiKey('openai', openaiKey);
    setApiKey('grok', grokKey);
    setStatus('Settings saved successfully!');
    setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to refresh services
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-neutral-900/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="text-yt-red" size={20} /> AI Configuration
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="p-6 space-y-6">
            <p className="text-sm text-gray-400">
                Configure your API keys to enable AI features. We support auto-switching between providers for maximum reliability.
            </p>

            {/* Gemini */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-blue-400 flex items-center gap-2">
                    <Zap size={14} /> Google Gemini (Primary)
                </label>
                <input 
                    type="password" 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={process.env.API_KEY ? "Using default env key (override here)" : "AIzaSy..."}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-blue-400 flex items-center gap-1">
                    Get Gemini Key <ExternalLink size={10} />
                </a>
            </div>

            {/* OpenAI */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-green-400 flex items-center gap-2">
                    <MessageSquare size={14} /> OpenAI (ChatGPT/DALL-E)
                </label>
                <input 
                    type="password" 
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
                 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-green-400 flex items-center gap-1">
                    Get OpenAI Key <ExternalLink size={10} />
                </a>
            </div>

            {/* Grok */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                    <Bot size={14} /> xAI (Grok)
                </label>
                <input 
                    type="password" 
                    value={grokKey}
                    onChange={(e) => setGrokKey(e.target.value)}
                    placeholder="xai-..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                />
                <a href="https://console.x.ai/" target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
                    Get Grok Key <ExternalLink size={10} />
                </a>
            </div>

            {status && (
                <div className="bg-green-500/10 text-green-400 text-sm p-3 rounded-lg text-center font-bold">
                    {status}
                </div>
            )}
        </div>

        <div className="p-6 pt-0">
            <button 
                onClick={handleSave}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
                <Save size={18} /> Save Configurations
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;