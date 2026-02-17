import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { analyzeThumbnail } from '../../services/geminiService';
import { Image as ImageIcon, Upload, Loader2, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const ThumbnailRater: React.FC = () => {
  const { t, language } = useLanguage();
  const [image, setImage] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Extract Mime Type and Base64 Data
      // Data URL format: data:[<mediatype>][;base64],<data>
      const mimeType = image.split(';')[0].split(':')[1];
      const base64Data = image.split(',')[1];
      
      const result = await analyzeThumbnail(base64Data, mimeType, context, language);
      if (result) setAnalysis(result);
    } catch (e) {
      console.error(e);
      alert(t.thumbnail.error);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setAnalysis('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ImageIcon className="text-purple-500" /> {t.thumbnail.title}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-colors relative ${image ? 'border-purple-500 bg-neutral-900' : 'border-neutral-700 hover:border-gray-500 bg-yt-gray'}`}>
             {image ? (
               <>
                 <img src={image} alt="Thumbnail Preview" className="h-full w-full object-contain rounded-lg p-2" />
                 <button onClick={clearImage} className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 p-2 rounded-full text-white transition-colors">
                   <X size={16} />
                 </button>
               </>
             ) : (
               <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <Upload className="mx-auto text-gray-500 mb-2" size={32} />
                 <p className="text-gray-400 font-medium">{t.thumbnail.uploadText}</p>
                 <p className="text-gray-600 text-sm mt-1">{t.thumbnail.uploadSubtext}</p>
               </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-400 mb-2">{t.thumbnail.contextLabel}</label>
             <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t.thumbnail.contextPlaceholder}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
             />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !image}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <><Loader2 className="animate-spin mr-2" /> {t.thumbnail.btnAnalyzing}</> : t.thumbnail.btnAnalyze}
          </button>
        </div>

        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 min-h-[300px]">
           {!analysis && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-gray-600">
               <ImageIcon size={48} className="mb-4 opacity-20" />
               <p>{t.thumbnail.emptyState}</p>
             </div>
           )}
           {loading && (
             <div className="h-full flex flex-col items-center justify-center text-purple-400">
               <Loader2 size={48} className="animate-spin mb-4" />
               <p>{t.thumbnail.loadingState}</p>
             </div>
           )}
           {analysis && (
             <article className="prose prose-invert prose-purple max-w-none animate-fade-in text-sm">
               <ReactMarkdown>{analysis}</ReactMarkdown>
             </article>
           )}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailRater;