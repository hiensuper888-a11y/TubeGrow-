import React, { useState, useEffect } from 'react';
import { getRealChannelStats, getRealChannelVideos } from '../../services/youtubeService';
import { getPublicChannelInfo, cleanAndParseJson } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Youtube, Users, SquarePlay, ChartBar, Loader2, Zap, SearchCheck, LogOut, AlertTriangle, Settings, Copy, Info, Search } from 'lucide-react';
import { AppView, ChannelStats, YouTubeVideo } from '../../types';

interface ChannelManagerProps {
  onNavigate: (view: AppView, data?: any) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const ChannelManager: React.FC<ChannelManagerProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  
  // OAuth State
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [clientId, setClientId] = useState('321987428274-v69og73esdlpprbev690poj2rfl1ut80.apps.googleusercontent.com');
  const [showClientIdInput, setShowClientIdInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrigin, setCurrentOrigin] = useState('');

  // Public Search State
  const [searchMode, setSearchMode] = useState(false);
  const [publicQuery, setPublicQuery] = useState('');

  // Check for env variable & Get Origin
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentOrigin(window.location.origin);
    }
    // @ts-ignore
    const envClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
    const storedId = localStorage.getItem('google_client_id');
    if (storedId) {
      setClientId(storedId);
    } else if (envClientId) {
      setClientId(envClientId);
    }
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (window.google && clientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/youtube.readonly',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              await fetchData(tokenResponse.access_token);
            }
          },
          error_callback: (nonOAuthError: any) => {
             console.error("GSI Error:", nonOAuthError);
             if (nonOAuthError.type === 'popup_closed') {
                setError("Pop-up was closed before login finished.");
             } else {
                setError("Connection blocked. Please check the steps below.");
             }
          }
        });
        setTokenClient(client);
      } catch (err) {
        console.error("GSI Init Error:", err);
      }
    }
  }, [clientId]);

  const fetchData = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await getRealChannelStats(accessToken);
      setChannel(stats);
      const vids = await getRealChannelVideos(accessToken);
      setVideos(vids);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to connect. Please check your Client ID configuration.");
      setChannel(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!clientId) {
      setShowClientIdInput(true);
      return;
    }
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      if (window.google) {
          const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/youtube.readonly',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              await fetchData(tokenResponse.access_token);
            }
          },
        });
        setTokenClient(client);
        client.requestAccessToken();
      } else {
        alert("Google Script not loaded. Please refresh the page.");
      }
    }
  };

  const handlePublicSearch = async () => {
      if(!publicQuery) return;
      setLoading(true);
      setError(null);
      try {
          const jsonStr = await getPublicChannelInfo(publicQuery, language);
          if(jsonStr) {
              const data = cleanAndParseJson(jsonStr);
              if(data) {
                  setChannel({
                      name: data.name || 'Unknown Channel',
                      subscriberCount: data.subscriberCount || 'N/A',
                      viewCount: data.viewCount || 'N/A',
                      videoCount: data.videoCount || 'N/A',
                      avatar: data.avatar || 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg'
                  });
                  setVideos(data.recentVideos || []);
              } else {
                  setError("Could not find channel info.");
              }
          }
      } catch (err: any) {
          setError("Failed to fetch public info. " + err.message);
      } finally {
          setLoading(false);
      }
  }

  const handleSaveClientId = () => {
    if(clientId.trim()) {
        localStorage.setItem('google_client_id', clientId.trim());
        setShowClientIdInput(false);
        const currentId = clientId;
        setClientId(''); 
        setTimeout(() => setClientId(currentId), 10);
    }
  };

  const handleDisconnect = () => {
    setChannel(null);
    setVideos([]);
    if(window.google && tokenClient) {
        window.google.accounts.oauth2.revoke(tokenClient, () => {
            console.log('Consent revoked');
        });
    }
  };

  const copyOrigin = () => {
      navigator.clipboard.writeText(currentOrigin);
      alert("Copied URL to clipboard!");
  };

  if (!channel) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-float">
          <Youtube size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{t.channel.title}</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Connect your YouTube channel for analytics, or search for any public channel to analyze.
        </p>

        {error && (
            <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 max-w-lg text-left">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <div>
                    <p className="font-bold text-sm">Action Failed</p>
                    <p className="text-xs opacity-90">{error}</p>
                </div>
            </div>
        )}

        {showClientIdInput ? (
             <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl w-full max-w-2xl mb-6 animate-fade-in-up shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Settings size={18} /> Configure Google OAuth
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-left">
                        <h4 className="text-blue-400 text-sm font-bold flex items-center gap-2 mb-2">
                            <Info size={14} /> 1. Fix "Error 400"
                        </h4>
                        <p className="text-[10px] text-gray-300 mb-2 leading-tight">
                            Add this URL to <strong>Authorized JavaScript origins</strong> in Cloud Console:
                        </p>
                        <div 
                            onClick={copyOrigin}
                            className="bg-black/50 border border-blue-500/20 p-2 rounded flex justify-between items-center cursor-pointer hover:bg-black/70 group transition-colors"
                        >
                            <code className="text-[10px] text-blue-300 font-mono truncate mr-2">{currentOrigin}</code>
                            <Copy size={12} className="text-gray-500 group-hover:text-white flex-shrink-0" />
                        </div>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg text-left">
                        <h4 className="text-yellow-400 text-sm font-bold flex items-center gap-2 mb-2">
                            <Users size={14} /> 2. Fix "Access Blocked"
                        </h4>
                        <p className="text-[10px] text-gray-300 mb-2 leading-tight">
                            Since your app is in "Testing" mode, you MUST add your email to <strong>Test Users</strong>.
                        </p>
                    </div>
                </div>

                <label className="block text-left text-sm font-bold text-gray-300 mb-2">
                    Client ID
                </label>
                <input 
                    type="text" 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="e.g. 123456-abcde.apps.googleusercontent.com"
                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white mb-6 focus:ring-2 focus:ring-red-500 outline-none text-xs font-mono"
                />

                <div className="flex gap-3">
                    <button onClick={() => setShowClientIdInput(false)} className="flex-1 py-3 rounded-lg hover:bg-white/5 text-gray-400 text-sm font-medium">Cancel</button>
                    <button onClick={handleSaveClientId} className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg text-white font-bold text-sm shadow-lg shadow-red-900/20">Save Configuration</button>
                </div>
             </div>
        ) : searchMode ? (
             /* SEARCH MODE */
             <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl w-full max-w-md mb-6 animate-fade-in-up">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <Search size={18} /> Analyze Public Channel
                </h3>
                <p className="text-xs text-gray-400 mb-4 text-left">
                   Enter a channel Name, Handle (@name), or URL. We'll use AI to find public stats.
                </p>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={publicQuery}
                        onChange={(e) => setPublicQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePublicSearch()}
                        placeholder="e.g. @MrBeast or Tech Reviews"
                        className="flex-1 bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setSearchMode(false)} className="flex-1 py-3 rounded-lg hover:bg-white/5 text-gray-400 text-sm">Cancel</button>
                    <button onClick={handlePublicSearch} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Analyze'}
                    </button>
                </div>
             </div>
        ) : (
             /* DEFAULT MODE */
             <div className="flex flex-col gap-4 items-center w-full max-w-sm">
                <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 px-8 rounded-full transition-all flex items-center justify-center gap-3 transform hover:scale-105 shadow-xl disabled:opacity-50"
                >
                {loading ? (
                    <>
                    <Loader2 className="animate-spin" /> {t.channel.connecting}
                    </>
                ) : (
                    <>
                    <Youtube size={24} className="text-red-600" />
                    {t.channel.connectBtn}
                    </>
                )}
                </button>
                
                <div className="flex items-center gap-3 w-full my-2">
                    <div className="h-[1px] bg-white/10 flex-1"></div>
                    <span className="text-xs text-gray-500 font-bold uppercase">OR</span>
                    <div className="h-[1px] bg-white/10 flex-1"></div>
                </div>

                <button 
                    onClick={() => setSearchMode(true)}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/5"
                >
                    <Search size={18} /> Analyze Any Public Channel
                </button>
                
                <button 
                    onClick={() => setShowClientIdInput(true)}
                    className="text-xs text-gray-500 hover:text-white underline flex items-center gap-1 mt-4"
                >
                    <Settings size={12} /> Configure API Keys
                </button>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 p-8 rounded-2xl border border-white/5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px]"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <img 
              src={channel.avatar} 
              alt={channel.name} 
              className="w-24 h-24 rounded-full border-4 border-neutral-800 shadow-xl object-cover"
            />
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{channel.name}</h2>
              <button 
                onClick={handleDisconnect}
                className="text-sm text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <LogOut size={14} /> {t.channel.disconnect}
              </button>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                <Users size={16} />
                <span className="text-xs uppercase tracking-wider">{t.channel.stats.subs}</span>
              </div>
              <div className="text-2xl font-bold text-white">{channel.subscriberCount}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                <ChartBar size={16} />
                <span className="text-xs uppercase tracking-wider">{t.channel.stats.views}</span>
              </div>
              <div className="text-2xl font-bold text-white">{channel.viewCount}</div>
            </div>
             <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-1">
                <SquarePlay size={16} />
                <span className="text-xs uppercase tracking-wider">{t.channel.stats.videos}</span>
              </div>
              <div className="text-2xl font-bold text-white">{channel.videoCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Video List */}
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <SquarePlay className="text-red-500" /> {t.channel.recentVideos}
      </h3>

      {videos.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No videos found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video, idx) => (
            <div key={video.id || idx} className="bg-neutral-900 rounded-xl border border-white/5 overflow-hidden group hover:border-red-500/30 transition-all hover:-translate-y-1">
                <div className="relative aspect-video">
                <img src={video.thumbnail || `https://img.youtube.com/vi/${video.url.split('v=')[1] || ''}/mqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                    <button
                    onClick={() => onNavigate(AppView.VIDEO_AUDIT, { url: video.url })}
                    className="w-full bg-white text-black font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-gray-200"
                    >
                    <SearchCheck size={16} /> {t.channel.actions.audit}
                    </button>
                    <button
                    onClick={() => onNavigate(AppView.VIRAL_STRATEGY, { topic: video.url })}
                    className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-red-700"
                    >
                    <Zap size={16} /> {t.channel.actions.strategy}
                    </button>
                </div>
                </div>
                <div className="p-4">
                <h4 className="font-bold text-sm text-gray-200 line-clamp-2 mb-2 group-hover:text-white transition-colors">{video.title}</h4>
                <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{video.views}</span>
                    <span>{video.publishedAt}</span>
                </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ChannelManager;