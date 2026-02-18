import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { analyzeUploadedVideo } from '../../services/geminiService';
import { ScanFace, Upload, Loader2, X, Video, FileVideo, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const VideoAnalyzer: React.FC = () => {
  const { t, language } = useLanguage();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_MB = 20;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const processFile = (file?: File) => {
    if (!file) return;
    
    // Check size limit (Browser limit for reading into memory safely)
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File too large. Max size is ${MAX_SIZE_MB}MB for browser analysis.`);
        return;
    }
    
    // Check type
    if (!file.type.startsWith('video/')) {
        setError("Invalid file type. Please upload a video file.");
        return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setAnalysis('');
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Extract base64 data (remove "data:video/mp4;base64," prefix)
        const base64Data = base64String.split(',')[1];
        
        try {
            const result = await analyzeUploadedVideo(
                base64Data, 
                videoFile.type, 
                prompt || "Analyze this video's visual content, audio, and pacing.", 
                language
            );
            if (result) setAnalysis(result);
        } catch (apiErr: any) {
            setError(apiErr.message || t.videoAnalyzer.error);
        } finally {
            setLoading(false);
        }
      };
      
      reader.onerror = () => {
          setError("Failed to read file.");
          setLoading(false);
      };

      reader.readAsDataURL(videoFile);
    } catch (e) {
      console.error(e);
      setError(t.videoAnalyzer.error);
      setLoading(false);
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setAnalysis('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ScanFace className="text-blue-400" /> {t.videoAnalyzer.title}
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-all relative group ${videoPreview ? 'border-blue-500 bg-black' : 'border-neutral-700 hover:border-blue-400 bg-yt-gray hover:bg-neutral-800'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
             {videoPreview ? (
               <div className="relative w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
                 <video src={videoPreview} controls className="max-h-full max-w-full" />
                 <button onClick={clearVideo} className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 p-2 rounded-full text-white transition-colors z-10">
                   <X size={16} />
                 </button>
               </div>
             ) : (
               <div className="text-center p-6 cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-blue-400" size={32} />
                 </div>
                 <p className="text-gray-300 font-bold text-lg">{t.videoAnalyzer.uploadText}</p>
                 <p className="text-gray-500 text-sm mt-2">{t.videoAnalyzer.uploadSubtext}</p>
               </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="video/*" className="hidden" />
          </div>

          {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertTriangle size={16} /> {error}
              </div>
          )}

          {/* Controls */}
          <div className="bg-neutral-900 p-5 rounded-xl border border-white/5 space-y-4">
             <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FileVideo size={14} /> {t.videoAnalyzer.promptLabel}
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.videoAnalyzer.promptPlaceholder}
                    className="w-full bg-black/40 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px] resize-none"
                />
             </div>

             <button
                onClick={handleAnalyze}
                disabled={loading || !videoFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
             >
                {loading ? <><Loader2 className="animate-spin" /> {t.videoAnalyzer.btnAnalyzing}</> : <><ScanFace size={20} /> {t.videoAnalyzer.btnAnalyze}</>}
             </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="bg-neutral-900/50 rounded-xl border border-white/5 p-6 min-h-[500px] flex flex-col">
           <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Analysis Result</h3>
           
           {!analysis && !loading && (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
               <Video size={64} className="mb-4 opacity-20" />
               <p className="max-w-xs text-center">{t.videoAnalyzer.emptyState}</p>
             </div>
           )}
           
           {loading && (
             <div className="flex-1 flex flex-col items-center justify-center text-blue-400">
               <div className="relative mb-4">
                   <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                   <Loader2 size={64} className="animate-spin relative z-10" />
               </div>
               <p className="animate-pulse font-medium">{t.videoAnalyzer.btnAnalyzing}</p>
               <p className="text-xs text-gray-500 mt-2">This may take a minute for larger files...</p>
             </div>
           )}

           {analysis && (
             <article className="prose prose-invert prose-blue max-w-none animate-fade-in custom-scrollbar overflow-y-auto flex-1">
               <ReactMarkdown>{analysis}</ReactMarkdown>
             </article>
           )}
        </div>
      </div>
    </div>
  );
};

export default VideoAnalyzer;