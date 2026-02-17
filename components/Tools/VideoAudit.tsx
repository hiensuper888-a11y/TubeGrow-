import React, { useState, useEffect } from 'react';
import { auditVideo, cleanAndParseJson } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, Loader2, CheckCircle2, XCircle, TrendingUp, Youtube, ExternalLink } from 'lucide-react';

interface VideoAuditProps {
  initialUrl?: string;
}

const VideoAudit: React.FC<VideoAuditProps> = ({ initialUrl }) => {
  const { t, language } = useLanguage();
  const [url, setUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleAudit = async () => {
    if (!url) return;
    setLoading(true);
    setResult(null);
    try {
      const jsonStr = await auditVideo(url, language);
      if (jsonStr) {
        const parsed = cleanAndParseJson(jsonStr);
        if (parsed) {
          setResult(parsed);
        } else {
          alert(t.audit.error);
        }
      }
    } catch (e) {
      alert(t.audit.error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Youtube className="text-yt-red" /> {t.audit.title}
      </h2>

      <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 mb-8">
        <label className="block text-sm font-medium text-gray-400 mb-2">{t.audit.urlLabel}</label>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.audit.urlPlaceholder}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yt-red focus:outline-none"
          />
          <button
            onClick={handleAudit}
            disabled={loading || !url}
            className="bg-yt-red hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 min-w-[160px]"
          >
            {loading ? <Loader2 className="animate-spin" /> : t.audit.btnAnalyze}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Summary */}
          <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 flex flex-col md:flex-row gap-6 items-center">
             <div className="relative w-32 h-32 flex items-center justify-center">
               <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-neutral-800"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className={getScoreColor(result.score)}
                    strokeDasharray={`${result.score}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
               </svg>
               <div className="absolute flex flex-col items-center">
                 <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>{result.score}</span>
                 <span className="text-xs text-gray-500 uppercase">Score</span>
               </div>
             </div>

             <div className="flex-1 text-center md:text-left">
               <h3 className="text-xl font-bold text-white mb-1">{result.videoTitle || 'Unknown Video'}</h3>
               
               {/* Display URL */}
               <a 
                 href={url} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="text-xs text-blue-400 hover:text-blue-300 mb-2 inline-flex items-center gap-1 transition-colors"
               >
                 {url} <ExternalLink size={10} />
               </a>

               <p className="text-sm text-gray-400 mb-3">{result.channelName || 'Unknown Channel'}</p>
               <p className="text-gray-300 italic">"{result.summary}"</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positives */}
            <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
               <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                 <CheckCircle2 size={20} /> {t.audit.positives}
               </h3>
               <ul className="space-y-3">
                 {result.positives?.map((item: string, i: number) => (
                   <li key={i} className="flex gap-3 text-sm text-gray-300">
                     <span className="text-green-500 mt-0.5">•</span>
                     {item}
                   </li>
                 ))}
               </ul>
            </div>

            {/* Negatives */}
            <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
               <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                 <XCircle size={20} /> {t.audit.negatives}
               </h3>
               <ul className="space-y-3">
                 {result.negatives?.map((item: string, i: number) => (
                   <li key={i} className="flex gap-3 text-sm text-gray-300">
                     <span className="text-red-500 mt-0.5">•</span>
                     {item}
                   </li>
                 ))}
               </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-blue-900/10 p-6 rounded-xl border border-blue-900/50">
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
              <TrendingUp size={20} /> {t.audit.suggestions}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.suggestions?.map((item: string, i: number) => (
                <div key={i} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 text-sm text-gray-300">
                  <span className="font-bold text-blue-500 mr-2">#{i + 1}</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAudit;