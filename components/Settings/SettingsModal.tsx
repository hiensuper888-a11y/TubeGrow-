import React, { useState, useEffect } from 'react';
import { X, Save, Key, Zap, CheckCircle2, Globe } from 'lucide-react';
import { getApiKey, setApiKey } from '../../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setLocalApiKey] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setLocalApiKey(getApiKey());
      setStatus('');
    }
  }, [isOpen]);

  const handleSave = () => {
    setApiKey(apiKey);
    setStatus('API Key saved successfully!');
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

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* Gemini Key */}
            <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                    <Zap size={18} className="text-blue-400" />
                    <label className="text-sm font-bold text-white uppercase tracking-wider">
                        Google Gemini API Key
                    </label>
                </div>
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                />
                <p className="text-[10px] text-gray-400 mb-3">
                    Using unlimited token model (Gemini 3 Pro) with Google Search enabled.
                </p>

                <div className="grid grid-cols-2 gap-2">
                     <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-green-500/20">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-xs text-green-100 font-medium">Gemini 3 Pro</span>
                    </div>
                     <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-blue-500/20">
                        <Globe size={12} className="text-blue-500" />
                        <span className="text-xs text-blue-100 font-medium">Google Search</span>
                    </div>
                </div>
            </div>

            {status && (
                <div className="bg-green-500/10 text-green-400 text-sm p-3 rounded-lg text-center font-bold animate-pulse">
                    {status}
                </div>
            )}
        </div>

        <div className="p-6 pt-0">
            <button 
                onClick={handleSave}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
                <Save size={18} /> Save Configuration
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;