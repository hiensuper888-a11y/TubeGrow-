import React, { useState, useEffect } from 'react';
import { X, Save, Key, Crown, CheckCircle2 } from 'lucide-react';
import { getApiKey, setApiKey } from '../../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [bonsaiKey, setLocalBonsaiKey] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setLocalBonsaiKey(getApiKey());
      setStatus('');
    }
  }, [isOpen]);

  const handleSave = () => {
    setApiKey(bonsaiKey);
    setStatus('Bonsai Key saved successfully!');
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
            
            {/* Bonsai Master Key */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-5 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                    <Crown size={18} className="text-yellow-400" />
                    <label className="text-sm font-bold text-white uppercase tracking-wider">
                        Bonsai API (Master Key)
                    </label>
                </div>
                <input 
                    type="password" 
                    value={bonsaiKey}
                    onChange={(e) => setLocalBonsaiKey(e.target.value)}
                    placeholder="sk_cr_..."
                    className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none mb-3"
                />
                <p className="text-[10px] text-gray-400 mb-3">
                    This single key powers all AI features (Gemini, GPT-4, Claude, Grok).
                </p>

                <div className="grid grid-cols-2 gap-2">
                    {['Gemini 3 Pro', 'ChatGPT-4o', 'Claude 3.5', 'Grok 3'].map(model => (
                        <div key={model} className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-green-500/20">
                            <CheckCircle2 size={12} className="text-green-500" />
                            <span className="text-xs text-green-100 font-medium">{model} Active</span>
                        </div>
                    ))}
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