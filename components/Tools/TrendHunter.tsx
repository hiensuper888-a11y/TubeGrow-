import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { findTrends } from '../../services/geminiService';
import { TrendingUp, Loader2, Globe, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const TrendHunter: React.FC = () => {
  const { t, language } = useLanguage();
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text?: string, groundingMetadata?: any } | null>(null);

  const handleSearch = async () => {
    if (!niche) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await findTrends(niche, language);
      setResult(data);
    } catch (e) {
      alert(t.trend.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="text-blue-500" /> {t.trend.title}
      </h2>
      
      <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 mb-8">
        <label className="block text-sm font-medium text-gray-400 mb-2">{t.trend.nicheLabel}</label>
        <div className="flex gap-4">
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t.trend.nichePlaceholder}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !niche}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : t.trend.btnFind}
          </button>
        </div>
      </div>

      {result && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
            <h3 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
              <Globe size={20} /> {t.trend.analysisTitle}
            </h3>
            <div className="prose prose-invert prose-blue max-w-none">
              <ReactMarkdown>{result.text || ''}</ReactMarkdown>
            </div>
          </div>

          {result.groundingMetadata?.groundingChunks && (
            <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.trend.sourcesTitle}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                  if (chunk.web) {
                    return (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors text-sm text-gray-300 hover:text-white group"
                      >
                         <div className="bg-neutral-900 p-2 rounded">
                            <ExternalLink size={14} className="text-blue-500" />
                         </div>
                         <div className="flex-1 truncate">
                            <div className="font-medium truncate">{chunk.web.title}</div>
                            <div className="text-xs text-gray-500 truncate">{chunk.web.uri}</div>
                         </div>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendHunter;