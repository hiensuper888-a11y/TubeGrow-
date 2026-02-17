import React from 'react';
import { LayoutDashboard, Wand2, FileText, TrendingUp, Image as ImageIcon, SearchCheck, ImagePlus, LogOut, Zap, Play, CircleUser } from 'lucide-react';
import { AppView, Language } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen }) => {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: AppView.DASHBOARD, label: t.sidebar.dashboard, icon: LayoutDashboard },
    { id: AppView.CHANNEL_MANAGER, label: t.sidebar.channelManager, icon: CircleUser },
    { id: AppView.VIRAL_STRATEGY, label: t.sidebar.viralStrategy, icon: Zap },
    { id: AppView.VIDEO_AUDIT, label: t.sidebar.videoAudit, icon: SearchCheck },
    { id: AppView.TREND_HUNTER, label: t.sidebar.trendHunter, icon: TrendingUp },
    { id: AppView.OPTIMIZER, label: t.sidebar.optimizer, icon: Wand2 },
    { id: AppView.SCRIPT_WRITER, label: t.sidebar.scriptWriter, icon: FileText },
    { id: AppView.THUMBNAIL_MAKER, label: t.sidebar.thumbnailMaker, icon: ImagePlus },
    { id: AppView.THUMBNAIL_RATER, label: t.sidebar.thumbnailRater, icon: ImageIcon },
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-72 glass-panel backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 flex flex-col shadow-2xl md:shadow-none`}
    >
      {/* Brand / Logo Area */}
      <div className="flex-none flex flex-col items-center justify-center pt-8 pb-6 border-b border-white/5 relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
         
         <div className="relative z-10 flex items-center gap-3 mb-1 transition-transform transform group-hover:scale-105 duration-300">
            {/* Custom Play Button Logo */}
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-red-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 border border-white/10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-t from-black/10 to-transparent">
                        <Play fill="white" className="text-white ml-1 drop-shadow-md" size={16} strokeWidth={0} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 font-sans leading-none">
                  TubeGrow<span className="text-yt-red">AI</span>
                </h1>
            </div>
         </div>
         <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold group-hover:text-yt-red transition-colors duration-300 mt-1">
            {t.auth.byAuthor}
         </span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4 pt-2">Menu</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isViral = item.id === AppView.VIRAL_STRATEGY;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-yt-red to-red-900/80 text-white shadow-lg shadow-red-900/40 translate-x-1' 
                  : isViral 
                    ? 'text-yellow-400 hover:bg-yellow-500/10 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-5'
              }`}
            >
              <Icon size={20} className={`transition-colors duration-300 ${
                  isActive ? 'text-white' : isViral ? 'text-yellow-400 animate-pulse' : 'text-gray-500 group-hover:text-white'
              }`} />
              <span className={`font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>}
            </button>
          );
        })}
      </nav>
      
      {/* Footer / User Profile */}
      <div className="flex-none p-4 border-t border-white/5 space-y-4 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3 px-2 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-default">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white/10">
                {user?.name?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.name || t.auth.guest}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
        </div>

        <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white px-2 py-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-300 border border-transparent hover:border-red-500/20"
        >
            <LogOut size={16} /> {t.auth.logout}
        </button>

        {/* Language Selector */}
        <div className="grid grid-cols-4 bg-black/40 rounded-lg p-1 border border-white/5 gap-1">
          {(['en', 'vi', 'zh', 'ja'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`py-1.5 text-[10px] font-bold uppercase rounded transition-all duration-200 ${
                language === lang 
                  ? 'bg-neutral-800 text-white shadow-md transform scale-105 ring-1 ring-white/10' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;