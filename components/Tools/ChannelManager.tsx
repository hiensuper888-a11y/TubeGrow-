import React, { useState } from 'react';
import { connectChannel, getChannelVideos } from '../../services/youtubeService';
import { useLanguage } from '../../contexts/LanguageContext';
import { Youtube, Users, SquarePlay, ChartBar, Loader2, ArrowRight, Zap, SearchCheck, LogOut } from 'lucide-react';
import { AppView, ChannelStats, YouTubeVideo } from '../../types';

interface ChannelManagerProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const ChannelManager: React.FC<ChannelManagerProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const stats = await connectChannel();
      setChannel(stats);
      const vids = await getChannelVideos();
      setVideos(vids);
    } catch (error) {
      console.error(error);
      // In a real app, show a toast or error message
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setChannel(null);
    setVideos([]);
  };

  if (!channel) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-float">
          <Youtube size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{t.channel.title}</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Connect your YouTube channel to access real-time analytics, manage videos, and apply AI optimization directly to your content.
        </p>
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
                <span>{video.views} views</span>
                <span>{video.publishedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelManager;