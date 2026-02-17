import React, { useState } from 'react';
import { generateVideoMetadata, cleanAndParseJson } from '../../services/geminiService';
import { Copy, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const Optimizer: React.FC = () => {
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Exciting');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const jsonStr = await generateVideoMetadata(topic, tone, language);
      if (jsonStr) {
        const parsed = cleanAndParseJson(jsonStr);
        if (parsed) {
          setResult(parsed);
        } else {
           // Fallback or alert if parsing really fails despite cleaning
           alert(t.optimizer.error);
        }
      }
    } catch (e) {
      alert(t.optimizer.error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="text-yt-red" /> {t.optimizer.title}
      </h2>
      
      <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-400 mb-2">{t.optimizer.topicLabel}</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.optimizer.topicPlaceholder}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yt-red focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t.optimizer.toneLabel}</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yt-red focus:outline-none"
            >
              {Object.keys(t.optimizer.tones).map((key) => (
                <option key={key} value={key}>{t.optimizer.tones[key]}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="mt-4 w-full bg-yt-red hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <><Loader2 className="animate-spin mr-2" /> {t.optimizer.btnGenerating}</> : t.optimizer.btnGenerate}
        </button>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Titles */}
          <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
            <h3 className="text-lg font-bold mb-4 text-blue-400">{t.optimizer.resultTitles}</h3>
            <div className="space-y-2">
              {result.titles?.map((title: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between group p-2 hover:bg-neutral-800 rounded">
                  <span className="font-medium text-gray-200">{title}</span>
                  <button onClick={() => copyToClipboard(title)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white">
                    <Copy size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-green-400">{t.optimizer.resultDesc}</h3>
              <button onClick={() => copyToClipboard(result.description)} className="text-gray-500 hover:text-white">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{result.description}</p>
          </div>

          {/* Tags */}
          <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-yellow-400">{t.optimizer.resultTags}</h3>
              <button onClick={() => copyToClipboard(result.tags)} className="text-gray-500 hover:text-white">
                <Copy size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.tags?.split(',').map((tag: string, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-neutral-800 text-gray-300 rounded-full text-xs">
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Optimizer;