import React, { useState, useEffect } from 'react';
import { getRealChannelStats, getRealChannelVideos } from '../../services/youtubeService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Youtube, Users, SquarePlay, ChartBar, Loader2, ArrowRight, Zap, SearchCheck, LogOut, AlertTriangle, Settings } from 'lucide-react';
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
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  
  // OAuth State
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [clientId, setClientId] = useState('');
  const [showClientIdInput, setShowClientIdInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for env variable
  useEffect(() => {
    // @ts-ignore
    const envClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';
    if (envClientId) {
      setClientId(envClientId);
    } else {
      // If no env var, check local storage for persistence
      const storedId = localStorage.getItem('google_client_id');
      if(storedId) setClientId(storedId);
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
      setError(error.message || "Failed to connect. Please check your Client ID and try again.");
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
      // Trigger the Google Popup
      tokenClient.requestAccessToken();
    } else {
      // Re-init if missing (e.g. user just pasted ID)
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
        alert("Google Identity Services script not loaded. Please refresh.");
      }
    }
  };

  const handleSaveClientId = () => {
    if(clientId.trim()) {
        localStorage.setItem('google_client_id', clientId.trim());
        setShowClientIdInput(false);
        // Force re-init effect
        const currentId = clientId;
        setClientId(''); 
        setTimeout(() => setClientId(currentId), 10);
    }
  };

  const handleDisconnect = () => {
    setChannel(null);
    setVideos([]);
    if(window.google) {
        window.google.accounts.oauth2.revoke(tokenClient, () => {
            console.log('Consent revoked');
        });
    }
  };

  if (!channel) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-float">
          <Youtube size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{t.channel.title}</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Connect your REAL YouTube channel to access live analytics. 
          Requires a Google Cloud Project with YouTube Data API v3 enabled.
        </p>

        {error && (
            <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 max-w-lg text-left">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <p className="text-sm">{error}</p>
            </div>
        )}

        {showClientIdInput ? (
             <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl w-full max-w-md mb-6 animate-fade-in-up">
                <label className="block text-left text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                    <Settings size={14} /> Google OAuth Client ID
                </label>
                <input 
                    type="text" 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="e.g. 123456-abcde.apps.googleusercontent.com"
                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-red-500 outline-none text-xs font-mono"
                />
                <div className="text-left text-xs text-gray-500 mb-4 space-y-1">
                    <p>1. Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-400 underline">Google Cloud Console</a>.</p>
                    <p>2. Create Project & Enable <strong>YouTube Data API v3</strong>.</p>
                    <p>3. Create <strong>OAuth Client ID</strong> (Web Application).</p>
                    <p>4. Add your domain to <strong>Authorized JavaScript origins</strong>.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowClientIdInput(false)} className="flex-1 py-2 rounded-lg hover:bg-white/5 text-gray-400">Cancel</button>
                    <button onClick={handleSaveClientId} className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-bold">Save ID</button>
                </div>
             </div>
        ) : (
             <div className="flex flex-col gap-4">
                <button
                onClick={handleConnect}
                disabled={loading}
                className="bg-white text-black hover:bg-gray-200 font-bold py-4 px-8 rounded-full transition-all flex items-center gap-3 transform hover:scale-105 shadow-xl disabled:opacity-50"
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
                <button 
                    onClick={() => setShowClientIdInput(true)}
                    className="text-xs text-gray-500 hover:text-white underline"
                >
                    {clientId ? 'Change Client ID' : 'Configure Client ID'}
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
              className="w-24 h-24 rounded-full border-4 border-neutral-800 shadow-xl"
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
            {videos.map((video) => (
            <div key={video.id} className="bg-neutral-900 rounded-xl border border-white/5 overflow-hidden group hover:border-red-500/30 transition-all hover:-translate-y-1">
                <div className="relative aspect-video">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
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