import React, { useState } from 'react';
import { generateThumbnailImage } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImagePlus, Loader2, Download, Sparkles, LayoutTemplate } from 'lucide-react';

const ThumbnailMaker: React.FC = () => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const ratios = [
    { label: '16:9 (YouTube)', value: '16:9', class: 'aspect-video' },
    { label: '9:16 (Shorts/TikTok)', value: '9:16', class: 'aspect-[9/16]' },
    { label: '1:1 (Square/Post)', value: '1:1', class: 'aspect-square' },
    { label: '4:3 (Standard)', value: '4:3', class: 'aspect-[4/3]' },
    { label: '3:4 (Portrait)', value: '3:4', class: 'aspect-[3/4]' }
  ];

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setImageUrl(null);
    try {
      const url = await generateThumbnailImage(prompt, aspectRatio);
      if (url) {
        setImageUrl(url);
      } else {
        alert(t.maker.error);
      }
    } catch (e) {
      alert(t.maker.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `thumbnail-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const activeRatioClass = ratios.find(r => r.value === aspectRatio)?.class || 'aspect-video';

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ImagePlus className="text-pink-500" /> {t.maker.title}
      </h2>
      
      <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 mb-8">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t.maker.promptLabel}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.maker.promptPlaceholder}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none min-h-[100px] resize-none"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-400 mb-2">{t.maker.ratioLabel || 'Aspect Ratio'}</label>
             <div className="flex flex-wrap gap-2">
                {ratios.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setAspectRatio(r.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      aspectRatio === r.value 
                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/50' 
                        : 'bg-neutral-900 text-gray-400 hover:bg-neutral-800 hover:text-white border border-neutral-700'
                    }`}
                  >
                    <LayoutTemplate size={14} />
                    {r.label}
                  </button>
                ))}
             </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 mt-2"
          >
            {loading ? <><Loader2 className="animate-spin mr-2" /> {t.maker.btnGenerating}</> : <><Sparkles className="mr-2" size={18}/> {t.maker.btnGenerate}</>}
          </button>
        </div>
      </div>

      {imageUrl && (
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 animate-fade-in flex flex-col items-center">
          <div className={`w-full max-w-2xl ${activeRatioClass} bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 shadow-2xl mb-6 transition-all duration-500`}>
            <img src={imageUrl} alt="Generated Thumbnail" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-lg transition-colors border border-neutral-700"
          >
            <Download size={20} />
            {t.maker.download}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThumbnailMaker;