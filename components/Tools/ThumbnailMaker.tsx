import React, { useState } from 'react';
import { generateThumbnailImage } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { ImagePlus, Loader2, Download, Sparkles } from 'lucide-react';

const ThumbnailMaker: React.FC = () => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setImageUrl(null);
    try {
      const url = await generateThumbnailImage(prompt);
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

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ImagePlus className="text-pink-500" /> {t.maker.title}
      </h2>
      
      <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 mb-8">
        <label className="block text-sm font-medium text-gray-400 mb-2">{t.maker.promptLabel}</label>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.maker.promptPlaceholder}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none min-h-[100px] resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <><Loader2 className="animate-spin mr-2" /> {t.maker.btnGenerating}</> : <><Sparkles className="mr-2" size={18}/> {t.maker.btnGenerate}</>}
          </button>
        </div>
      </div>

      {imageUrl && (
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 animate-fade-in flex flex-col items-center">
          <div className="w-full max-w-2xl aspect-video bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 shadow-2xl mb-6">
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