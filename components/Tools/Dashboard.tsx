import React from 'react';
import { AppView } from '../../types';
import { ArrowRight, BarChart3, Target, Zap, SearchCheck, ImagePlus, UserCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const stats = [
    { label: 'Weekly Growth', value: '+12.5%', color: 'text-green-500' },
    { label: 'Content Score', value: '88/100', color: 'text-blue-500' },
    { label: 'Videos Audited', value: '14', color: 'text-purple-500' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div className="space-y-2">
            <h2 className="text-4xl font-bold text-white tracking-tight">
            {t.dashboard.welcome} <span className="text-yt-red">{user?.name}</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl">
            {t.dashboard.subtitle}
            </p>
        </div>
        <div className="flex gap-4">
             {stats.map((stat, i) => (
                 <div key={i} className="text-right hidden lg:block">
                     <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                     <div className="text-xs text-gray-500 uppercase">{stat.label}</div>
                 </div>
             ))}
        </div>
      </header>

      {/* Hero Card for Viral Strategy */}
      <div 
        onClick={() => onNavigate(AppView.VIRAL_STRATEGY)}
        className="bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/30 rounded-2xl p-8 cursor-pointer hover:border-yellow-500/60 transition-all group relative overflow-hidden"
      >
         <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px]"></div>
         <div className="relative z-10">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 bg-yellow-500 text-black rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
               <Zap size={28} fill="currentColor" />
             </div>
             <span className="bg-yellow-500/20 text-yellow-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">New Feature</span>
           </div>
           <h3 className="text-2xl font-bold text-white mb-2">{t.dashboard.viralTitle}</h3>
           <p className="text-gray-300 max-w-2xl text-lg mb-6">{t.dashboard.viralDesc}</p>
           <div className="flex items-center text-yellow-400 font-bold group-hover:translate-x-2 transition-transform">
             {t.dashboard.viralBtn} <ArrowRight size={20} className="ml-2" />
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Tool Cards with Glassmorphism */}
        
        <div className="bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20" onClick={() => onNavigate(AppView.VIDEO_AUDIT)}>
          <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-5 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <SearchCheck size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-100">{t.dashboard.auditTitle}</h3>
          <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">{t.dashboard.auditDesc}</p>
          <div className="flex items-center text-purple-400 text-sm font-bold mt-auto group-hover:translate-x-1 transition-transform">
            {t.dashboard.auditBtn} <ArrowRight size={16} className="ml-2" />
          </div>
        </div>

        <div className="bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20" onClick={() => onNavigate(AppView.TREND_HUNTER)}>
          <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <BarChart3 size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-100">{t.dashboard.trendTitle}</h3>
          <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">{t.dashboard.trendDesc}</p>
          <div className="flex items-center text-blue-400 text-sm font-bold mt-auto group-hover:translate-x-1 transition-transform">
            {t.dashboard.trendBtn} <ArrowRight size={16} className="ml-2" />
          </div>
        </div>

        <div className="bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-yt-red/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/20" onClick={() => onNavigate(AppView.OPTIMIZER)}>
          <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center text-yt-red mb-5 group-hover:bg-yt-red group-hover:text-white transition-colors">
            <Target size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-100">{t.dashboard.optimizerTitle}</h3>
          <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">{t.dashboard.optimizerDesc}</p>
          <div className="flex items-center text-red-400 text-sm font-bold mt-auto group-hover:translate-x-1 transition-transform">
            {t.dashboard.optimizerBtn} <ArrowRight size={16} className="ml-2" />
          </div>
        </div>

        <div className="bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-pink-500/50 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-900/20" onClick={() => onNavigate(AppView.THUMBNAIL_MAKER)}>
          <div className="w-14 h-14 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500 mb-5 group-hover:bg-pink-500 group-hover:text-white transition-colors">
            <ImagePlus size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-100">{t.dashboard.makerTitle}</h3>
          <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">{t.dashboard.makerDesc}</p>
          <div className="flex items-center text-pink-400 text-sm font-bold mt-auto group-hover:translate-x-1 transition-transform">
            {t.dashboard.makerBtn} <ArrowRight size={16} className="ml-2" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-neutral-900/80 to-neutral-800/80 backdrop-blur-xl rounded-2xl p-8 border border-white/5 mt-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yt-red/5 rounded-full blur-[80px]"></div>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
            <Zap className="text-yellow-500" /> {t.dashboard.tipsTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-400 relative z-10">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yt-red mt-2"></span>
                <span>{t.dashboard.tip1}</span>
            </li>
            <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yt-red mt-2"></span>
                <span>{t.dashboard.tip2}</span>
            </li>
            <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yt-red mt-2"></span>
                <span>{t.dashboard.tip3}</span>
            </li>
          </ul>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yt-red mt-2"></span>
                <span>{t.dashboard.tip4}</span>
            </li>
            <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yt-red mt-2"></span>
                <span>{t.dashboard.tip5}</span>
            </li>
            <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yt-red mt-2"></span>
                <span>{t.dashboard.tip6}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;