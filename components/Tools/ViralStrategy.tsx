import React, { useState, useEffect } from 'react';
import { generateViralStrategy, generateThumbnailImage, cleanAndParseJson, checkApiKey } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Zap, Loader2, Target, Type, Image as ImageIcon, FileText, Megaphone, CheckCircle2, Copy, Download, SearchCheck, Tv, AlertCircle, Globe, ExternalLink, Lightbulb, Users, BrainCircuit, Rocket, Palette, MessageSquare } from 'lucide-react';
import { AppView } from '../../types';

interface ViralStrategyProps {
  initialTopic?: string;
  onNavigate?: (view: AppView, data?: any) => void;
}

const ViralStrategy: React.FC<ViralStrategyProps> = ({ initialTopic, onNavigate }) => {
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState(initialTopic || '');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'script' | 'visuals' | 'launch'>('overview');

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadStrategy = () => {
    if (!result) return;

    try {
      const getList = (arr: any[]) => Array.isArray(arr) ? arr.map(s => `- ${s}`).join('\n') : '';
      const getHooks = (arr: any[]) => Array.isArray(arr) ? arr.map(h => `**${h.type}:** ${h.script} (${h.why})`).join('\n\n') : '';

      const content = `
# ${result.strategyTitle || 'Viral Strategy'}

## 🎯 Target Audience
**Persona:** ${result.targetAudience?.persona || 'N/A'}
**Pain Points:** ${getList(result.targetAudience?.painPoints)}
**Desires:** ${getList(result.targetAudience?.desires)}

## 💡 Competitor Gap
${result.competitorGap || 'N/A'}

## 🪝 Hooks (First 30s)
${getHooks(result.hooks)}

## 🖼️ Thumbnail Strategy
**Visual:** ${result.thumbnailStrategy?.visualDescription || 'N/A'}
**Text Overlay:** ${result.thumbnailStrategy?.textOverlay || 'N/A'}
**Color Psychology:** ${result.thumbnailStrategy?.colorPsychology || 'N/A'}
**Layout:** ${result.thumbnailStrategy?.layout || 'N/A'}

## 📝 Script Structure
**Intro:** ${result.scriptStructure?.intro || 'N/A'}
**Rising Action:** ${result.scriptStructure?.risingAction || 'N/A'}
**Climax:** ${result.scriptStructure?.climax || 'N/A'}
**CTA:** ${result.scriptStructure?.cta || 'N/A'}

## 📈 Metadata
### Titles
${getList(result.metadata?.titleOptions)}

### Description
${result.metadata?.description || 'N/A'}

### Tags
${getList(result.metadata?.tags)}

## 🚀 Launch Plan
${getList(result.launchPlan)}

## 💬 Engagement Triggers
**Pinned Comment:** ${result.engagementTriggers?.pinnedComment || 'N/A'}
**Question to Ask:** ${result.engagementTriggers?.inVideoQuestion || 'N/A'}
      `.trim();

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TubeGrow-MasterStrategy-${Date.now()}.md`;
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
    setError(null);
    setActiveTab('overview');
    
    if (!checkApiKey()) {
        setError("API Key is missing or invalid.");
        setLoading(false);
        return;
    }

    try {
      const { text, groundingMetadata } = await generateViralStrategy(topic, language);
      
      if (!text) throw new Error("AI returned empty response.");

      const parsed = cleanAndParseJson(text);
      
      if (parsed) {
          setResult({ ...parsed, groundingMetadata });

          if (parsed.thumbnailStrategy?.visualDescription) {
              setImageLoading(true);
              generateThumbnailImage(parsed.thumbnailStrategy.visualDescription)
                .then(url => { if(url) setGeneratedThumbnail(url); })
                .catch(err => console.error("Image gen failed", err))
                .finally(() => setImageLoading(false));
          }
      } else {
           throw new Error("Could not understand AI response.");
      }
    } catch (e: any) {
      console.error("Strategy Gen Error", e);
      setError(e.message || t.viral.error);
    } finally {
      setLoading(false);
    }
  };

  const isUrl = topic.toLowerCase().includes('youtube.com') || topic.toLowerCase().includes('youtu.be');

  // --- RENDER HELPERS ---
  
  const renderOverviewTab = () => (
      <div className="space-y-6 animate-fade-in">
          {/* Top Level Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-white/5">
                  <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                      <Users size={20} /> Target Audience
                  </h3>
                  <p className="text-gray-300 italic mb-4">"{result.targetAudience?.persona}"</p>
                  <div className="space-y-3">
                      <div>
                          <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Pain Points</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                              {result.targetAudience?.painPoints?.map((p:string, i:number) => (
                                  <span key={i} className="bg-red-900/20 text-red-200 px-2 py-1 rounded text-xs border border-red-500/20">{p}</span>
                              ))}
                          </div>
                      </div>
                      <div>
                          <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Desires</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                              {result.targetAudience?.desires?.map((p:string, i:number) => (
                                  <span key={i} className="bg-green-900/20 text-green-200 px-2 py-1 rounded text-xs border border-green-500/20">{p}</span>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit size={100} /></div>
                   <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2 relative z-10">
                      <Lightbulb size={20} /> The Competitor Gap
                  </h3>
                  <p className="text-gray-200 text-lg leading-relaxed relative z-10">
                      {result.competitorGap}
                  </p>
              </div>
          </div>

          {/* Engagement Triggers */}
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare size={20} /> Engagement Triggers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-black/30 p-4 rounded-xl border-l-4 border-purple-500">
                      <span className="text-xs text-purple-400 font-bold uppercase block mb-1">Pinned Comment Strategy</span>
                      <p className="text-gray-300 text-sm">"{result.engagementTriggers?.pinnedComment}"</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border-l-4 border-blue-500">
                      <span className="text-xs text-blue-400 font-bold uppercase block mb-1">In-Video Question</span>
                      <p className="text-gray-300 text-sm">"{result.engagementTriggers?.inVideoQuestion}"</p>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderScriptTab = () => (
      <div className="space-y-6 animate-fade-in">
          {/* HOOKS */}
          <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="text-yellow-500" /> Hook Options (Choose One)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.hooks?.map((hook: any, i: number) => (
                      <div key={i} className="bg-neutral-900/60 p-5 rounded-xl border border-white/10 hover:border-yellow-500/50 transition-colors group">
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-bold bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded uppercase">{hook.type}</span>
                          </div>
                          <p className="text-gray-200 font-medium mb-3 text-sm">"{hook.script}"</p>
                          <p className="text-gray-500 text-xs italic border-t border-white/5 pt-2">Why: {hook.why}</p>
                      </div>
                  ))}
              </div>
          </div>

          {/* STRUCTURE */}
          <div className="bg-neutral-900/40 p-6 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                  <FileText className="text-green-500" /> Narrative Arc
              </h3>
              <div className="space-y-0 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-neutral-800"></div>

                  {[
                      { label: "Intro & Setup", content: result.scriptStructure?.intro, color: "text-green-400" },
                      { label: "Rising Action", content: result.scriptStructure?.risingAction, color: "text-blue-400" },
                      { label: "The Climax", content: result.scriptStructure?.climax, color: "text-red-400" },
                      { label: "Call to Action", content: result.scriptStructure?.cta, color: "text-purple-400" },
                  ].map((part, i) => (
                      <div key={i} className="relative pl-12 pb-8 last:pb-0">
                          <div className="absolute left-2 top-0 w-4 h-4 rounded-full bg-neutral-800 border-2 border-neutral-600"></div>
                          <h4 className={`text-sm font-bold uppercase mb-1 ${part.color}`}>{part.label}</h4>
                          <p className="text-gray-300 text-sm">{part.content}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const renderVisualsTab = () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Thumbnail Preview & Strategy */}
          <div className="space-y-6">
              <div className="w-full aspect-video bg-black/40 rounded-xl border border-purple-500/20 overflow-hidden flex items-center justify-center relative group">
                  {imageLoading ? (
                      <div className="flex flex-col items-center text-purple-400">
                          <Loader2 className="animate-spin mb-2" size={32} />
                          <span className="text-xs animate-pulse">Designing Thumbnail...</span>
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
                          <span className="text-xs font-bold">Download</span>
                        </a>
                      </>
                  ) : (
                      <div className="text-gray-500 text-sm">Image generation failed</div>
                  )}
              </div>

              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><Palette size={18} /> Visual Psychology</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="bg-black/30 p-3 rounded-lg">
                           <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Color Theory</span>
                           <p className="text-sm text-purple-300">{result.thumbnailStrategy?.colorPsychology}</p>
                       </div>
                       <div className="bg-black/30 p-3 rounded-lg">
                           <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Layout</span>
                           <p className="text-sm text-blue-300">{result.thumbnailStrategy?.layout}</p>
                       </div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                        <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Text Overlay</span>
                        <p className="text-xl font-black text-white uppercase tracking-tight">{result.thumbnailStrategy?.textOverlay}</p>
                   </div>
              </div>
          </div>

          {/* Metadata */}
          <div className="bg-neutral-900/50 p-6 rounded-2xl border border-white/5 flex flex-col h-full">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Type size={18} /> High-CTR Titles</h3>
              <div className="space-y-3 mb-8 flex-1">
                 {result.metadata?.titleOptions?.map((title: string, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 hover:border-red-500/50 transition-colors group">
                        <span className="text-gray-200 font-medium text-sm">{title}</span>
                        <button onClick={() => copyToClipboard(title)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100">
                            <Copy size={14} />
                        </button>
                    </div>
                 ))}
              </div>

              <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Description Snippet</h3>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-sm text-gray-400 max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                      {result.metadata?.description}
                  </div>
              </div>
              
              <div className="mt-4">
                   <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Tags</h3>
                   <div className="flex flex-wrap gap-2">
                        {result.metadata?.tags?.map((tag: string, i: number) => (
                            <span key={i} className="text-xs bg-neutral-800 text-gray-400 px-2 py-1 rounded">#{tag}</span>
                        ))}
                   </div>
              </div>
          </div>
      </div>
  );

  const renderLaunchTab = () => (
      <div className="animate-fade-in">
          <div className="bg-gradient-to-br from-blue-900/20 to-green-900/20 p-8 rounded-2xl border border-blue-500/20">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Rocket className="text-blue-400" /> Launch Protocol
              </h3>
              <div className="space-y-6">
                  {result.launchPlan?.map((step: string, i: number) => (
                      <div key={i} className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-lg shadow-blue-600/30">
                              {i + 1}
                          </div>
                          <div className="bg-black/30 p-4 rounded-xl flex-1 border border-white/5">
                              <p className="text-gray-200 font-medium">{step}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

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

        {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-xl mb-6 flex items-center gap-3 animate-fade-in">
                <AlertCircle className="flex-shrink-0" />
                <div>
                    <p className="font-bold">Generation Failed</p>
                    <p className="text-sm opacity-90">{error}</p>
                </div>
            </div>
        )}

        {/* INPUT SECTION */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 p-8 rounded-2xl border border-yellow-500/20 mb-8 shadow-lg shadow-yellow-900/10">
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

        {/* RESULTS SECTION */}
        {result && (
          <div className="animate-fade-in relative">
            
            {/* Strategy Title Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                 <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">{result.strategyTitle}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        {isUrl && <span className="bg-red-600/20 text-red-400 text-xs font-bold px-2 py-1 rounded border border-red-600/30 flex items-center gap-1"><Tv size={12} /> Existing Video Analysis</span>}
                        <span className="text-gray-500 text-sm">Generated by Gemini 3 Pro</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                     <button
                        onClick={handleDownloadStrategy}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors shadow-lg group"
                        >
                        <Download size={18} className="group-hover:text-green-400 transition-colors" />
                        <span className="text-sm font-medium">Save .MD</span>
                    </button>
                    {onNavigate && (
                        <button
                            onClick={() => onNavigate(AppView.VIDEO_AUDIT, { url: isUrl ? topic : '' })}
                            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors shadow-lg group"
                        >
                            <SearchCheck size={18} className="group-hover:text-blue-400 transition-colors" />
                            <span className="text-sm font-medium">Audit</span>
                        </button>
                    )}
                 </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex overflow-x-auto pb-2 mb-6 gap-2 border-b border-white/10 custom-scrollbar">
                {[
                    { id: 'overview', label: 'Overview', icon: Target },
                    { id: 'script', label: 'Script & Hooks', icon: FileText },
                    { id: 'visuals', label: 'Visuals & SEO', icon: ImageIcon },
                    { id: 'launch', label: 'Launch Plan', icon: Rocket },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-neutral-800 text-white border-b-2 border-yellow-500' 
                            : 'text-gray-500 hover:text-white hover:bg-neutral-800/50'
                        }`}
                    >
                        <tab.icon size={18} className={activeTab === tab.id ? 'text-yellow-500' : ''} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'script' && renderScriptTab()}
                {activeTab === 'visuals' && renderVisualsTab()}
                {activeTab === 'launch' && renderLaunchTab()}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ViralStrategy;