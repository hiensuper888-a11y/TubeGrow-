import React, { useState } from 'react';
import { generateViralStrategy, generateThumbnailImage, cleanAndParseJson } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Zap, Loader2, Target, Type, Image as ImageIcon, FileText, Megaphone, CheckCircle2, Copy, Download, SearchCheck, ThumbsUp, ThumbsDown, Tv } from 'lucide-react';

const ViralStrategy: React.FC = () => {
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadStrategy = () => {
    if (!result) return;

    try {
      const getList = (arr: any[]) => Array.isArray(arr) ? arr.map(s => `- ${s}`).join('\n') : '';
      const getTags = (arr: any[]) => Array.isArray(arr) ? arr.map(t => `#${t}`).join(' ') : '';

      const content = `
# ${result.strategyTitle || 'Viral Strategy'}
${result.originalChannel ? `**Original Channel:** ${result.originalChannel}\n` : ''}

## Analysis
**Strengths:**
${getList(result.analysis?.strengths)}

**Weaknesses (Needs Improvement):**
${getList(result.analysis?.weaknesses)}

## Target Audience
${result.targetAudience || 'N/A'}

## Trend Context
${result.trendContext || 'N/A'}

## Metadata
### Titles
${getList(result.metadata?.titleOptions)}

### Description
${result.metadata?.description || 'N/A'}

### Tags
${getTags(result.metadata?.tags)}

## Thumbnail Idea
**Visual:** ${result.thumbnailIdea?.visualDescription || 'N/A'}
**Text Overlay:** ${result.thumbnailIdea?.textOverlay || 'N/A'}

## Script Outline
**Hook:** ${result.scriptOutline?.hook || 'N/A'}
**Content Beats:**
${getList(result.scriptOutline?.contentBeats)}
**CTA:** ${result.scriptOutline?.cta || 'N/A'}

## Promotion Plan
${getList(result.promotionPlan)}
      `.trim();

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TubeGrow-Strategy-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      alert("Could not generate download file.");
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setResult(null);
    setGeneratedThumbnail(null);
    
    try {
      // 1. Generate Text Strategy
      const jsonStr = await generateViralStrategy(topic, language);
      if (jsonStr) {
        const parsed = cleanAndParseJson(jsonStr);
        if (parsed) {
            setResult(parsed);

            // 2. Generate Image immediately if we have a description
            if (parsed.thumbnailIdea?.visualDescription) {
                setImageLoading(true);
                generateThumbnailImage(parsed.thumbnailIdea.visualDescription)
                  .then(url => {
                      if(url) setGeneratedThumbnail(url);
                  })
                  .catch(err => console.error("Image gen failed", err))
                  .finally(() => setImageLoading(false));
            }
        } else {
             alert("Failed to parse the strategy. Please try again.");
        }
      }
    } catch (e) {
      console.error(e);
      alert(t.viral.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative min-h-[80vh]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden rounded-3xl">
         <img 
           src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
           alt="Analytics Background" 
           className="w-full h-full object-cover grayscale"
         />
         <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808]"></div>
      </div>

      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Zap className="text-yellow-400" fill="currentColor" /> {t.viral.title}
        </h2>

        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 p-8 rounded-2xl border border-yellow-500/20 mb-10 shadow-lg shadow-yellow-900/10">
          <label className="block text-lg font-medium text-white mb-3">{t.viral.topicLabel}</label>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.viral.topicPlaceholder}
              className="flex-1 bg-black/40 border border-neutral-700 rounded-xl px-6 py-4 text-white text-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-4 px-8 rounded-xl transition-transform transform active:scale-95 flex items-center justify-center disabled:opacity-50 min-w-[220px] shadow-lg shadow-yellow-500/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : t.viral.btnGenerate}
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="text-center mb-8 relative">
              
              {/* Download Strategy Button (Desktop) */}
              <div className="absolute right-0 top-0 hidden md:block">
                <button
                  onClick={handleDownloadStrategy}
                  className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors shadow-lg group"
                >
                  <Download size={18} className="group-hover:text-yt-red transition-colors" />
                  <span className="text-sm font-medium">{t.viral.btnDownloadStrategy}</span>
                </button>
              </div>

              <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-2">
                {result.strategyTitle || 'Strategy Generated'}
              </h3>
              
              {/* Display Original Channel Name if available */}
              {result.originalChannel && (
                  <div className="flex items-center justify-center gap-2 mb-2 text-white bg-red-600/20 px-4 py-1 rounded-full w-fit mx-auto border border-red-500/30">
                      <Tv size={16} className="text-red-400" />
                      <span className="font-semibold">{result.originalChannel}</span>
                  </div>
              )}

              <p className="text-gray-400 text-lg">{result.targetAudience}</p>

              {/* Download Strategy Button (Mobile) */}
              <button
                  onClick={handleDownloadStrategy}
                  className="md:hidden mt-4 flex items-center gap-2 mx-auto bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors shadow-lg"
              >
                  <Download size={18} />
                  <span className="text-sm font-medium">{t.viral.btnDownloadStrategy}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Analysis Section (Strengths & Weaknesses) */}
              {result.analysis && (
                <div className="bg-neutral-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 lg:col-span-2">
                   <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                     <SearchCheck size={24} className="text-blue-400" /> {t.viral.analysisSection}
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <div className="bg-green-900/10 p-5 rounded-xl border border-green-500/20">
                         <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                           <ThumbsUp size={18} /> {t.viral.strengths}
                         </h4>
                         <ul className="space-y-2">
                            {result.analysis.strengths?.map((item: string, i: number) => (
                               <li key={i} className="flex gap-2 text-gray-300 text-sm">
                                 <span className="text-green-500 mt-1">•</span> <span>{item}</span>
                               </li>
                            ))}
                         </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-red-900/10 p-5 rounded-xl border border-red-500/20">
                         <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                           <ThumbsDown size={18} /> {t.viral.weaknesses}
                         </h4>
                         <ul className="space-y-2">
                            {result.analysis.weaknesses?.map((item: string, i: number) => (
                               <li key={i} className="flex gap-2 text-gray-300 text-sm">
                                 <span className="text-red-500 mt-1">•</span> <span>{item}</span>
                               </li>
                            ))}
                         </ul>
                      </div>
                   </div>
                </div>
              )}

              {/* Trend Context */}
              <div className="bg-neutral-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 lg:col-span-2">
                 <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2">
                   <Target size={24} /> {t.viral.trendSection}
                 </h3>
                 <p className="text-gray-200 leading-relaxed text-lg">{result.trendContext}</p>
              </div>

              {/* Thumbnail Idea & Image */}
              <div className="bg-neutral-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 order-2 lg:order-1">
                <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                   <ImageIcon size={24} /> {t.viral.thumbSection}
                 </h3>
                 
                 {/* AI Generated Image Display */}
                 <div className="mb-4 w-full aspect-video bg-black/40 rounded-xl border border-purple-500/20 overflow-hidden flex items-center justify-center relative group">
                    {imageLoading ? (
                        <div className="flex flex-col items-center text-purple-400">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <span className="text-xs animate-pulse">Generating AI Image...</span>
                        </div>
                    ) : generatedThumbnail ? (
                        <>
                          <img src={generatedThumbnail} alt="AI Thumbnail" className="w-full h-full object-cover" />
                          <a 
                            href={generatedThumbnail} 
                            download={`thumbnail-${Date.now()}.png`}
                            className="absolute bottom-3 right-3 bg-black/60 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-all flex items-center gap-2"
                          >
                            <Download size={16} />
                            <span className="text-xs font-bold">{t.viral.downloadThumbnail}</span>
                          </a>
                        </>
                    ) : (
                        <div className="text-gray-500 text-sm">Image generation failed</div>
                    )}
                 </div>

                 <div className="space-y-4">
                   <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/20">
                     <span className="text-xs font-bold text-purple-500 uppercase tracking-wider block mb-1">Visual Prompt</span>
                     <p className="text-gray-200 text-sm">{result.thumbnailIdea?.visualDescription}</p>
                   </div>
                   <div className="bg-pink-900/10 p-4 rounded-xl border border-pink-500/20">
                     <span className="text-xs font-bold text-pink-500 uppercase tracking-wider block mb-1">Text Overlay</span>
                     <p className="text-xl font-black text-white font-outline-2 uppercase">{result.thumbnailIdea?.textOverlay}</p>
                   </div>
                 </div>
              </div>

              {/* Metadata (Titles & Desc) */}
              <div className="bg-neutral-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 order-1 lg:order-2 flex flex-col">
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                   <Type size={24} /> {t.viral.titleSection}
                 </h3>
                 
                 <div className="space-y-3 mb-6">
                   {result.metadata?.titleOptions?.map((title: string, i: number) => (
                     <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 text-gray-200 font-medium hover:border-red-500/50 transition-colors group">
                       <span>{title}</span>
                       <button onClick={() => copyToClipboard(title)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy size={16} />
                       </button>
                     </div>
                   ))}
                 </div>

                 {result.metadata?.description && (
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-4 flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">Video Description</span>
                          <button onClick={() => copyToClipboard(result.metadata.description)} className="text-gray-500 hover:text-white">
                              <Copy size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-64 overflow-y-auto">{result.metadata.description}</p>
                    </div>
                 )}

                 <div className="flex flex-wrap gap-2 mt-auto">
                    {result.metadata?.tags?.map((tag: string, i: number) => (
                      <span key={i} className="text-xs text-gray-400 bg-neutral-800 px-2 py-1 rounded-full">#{tag}</span>
                    ))}
                 </div>
              </div>

              {/* Script Outline */}
              <div className="bg-neutral-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 lg:col-span-2 order-3">
                 <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                   <FileText size={24} /> {t.viral.scriptSection}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5">
                      <span className="text-green-500 font-bold mb-2 block">THE HOOK (0-15s)</span>
                      <p className="text-sm text-gray-300">{result.scriptOutline?.hook}</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5">
                      <span className="text-green-500 font-bold mb-2 block">THE MEAT</span>
                      <ul className="space-y-2">
                        {result.scriptOutline?.contentBeats?.map((beat: string, i: number) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-green-500/50 mt-1">•</span> {beat}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5">
                       <span className="text-green-500 font-bold mb-2 block">THE CTA</span>
                       <p className="text-sm text-gray-300">{result.scriptOutline?.cta}</p>
                    </div>
                 </div>
              </div>

               {/* Promotion Plan */}
               <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 rounded-2xl border border-blue-500/20 lg:col-span-2 order-4">
                 <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                   <Megaphone size={24} /> {t.viral.promoSection}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {result.promotionPlan?.map((plan: string, i: number) => (
                     <div key={i} className="flex gap-3 bg-black/20 p-4 rounded-xl">
                        <CheckCircle2 className="text-blue-400 flex-shrink-0" size={20} />
                        <p className="text-sm text-gray-200">{plan}</p>
                     </div>
                   ))}
                 </div>
              </div>

            </div>

            {/* Bottom Download Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={handleDownloadStrategy}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl border border-white/10 transition-all hover:border-white/20 shadow-lg group"
              >
                <Download size={20} className="group-hover:text-yt-red transition-colors" />
                <span className="font-bold">{t.viral.btnDownloadStrategy}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViralStrategy;