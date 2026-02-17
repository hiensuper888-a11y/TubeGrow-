import React from 'react';
import { AppView } from '../../types';
import { ArrowRight, BarChart3, Target, Zap } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header className="space-y-4 text-center md:text-left">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
          Welcome to TubeGrow AI
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl">
          Supercharge your YouTube channel with organic growth tools. Stop guessing and start creating with data-driven AI insights.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 hover:border-yt-red/50 transition-colors group cursor-pointer" onClick={() => onNavigate(AppView.OPTIMIZER)}>
          <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center text-yt-red mb-4 group-hover:bg-red-500/20">
            <Target size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Metadata Optimizer</h3>
          <p className="text-gray-400 text-sm mb-4">Generate high-CTR titles, engaging descriptions, and perfectly matched tags.</p>
          <div className="flex items-center text-yt-red text-sm font-medium">
            Try Optimizer <ArrowRight size={16} className="ml-1" />
          </div>
        </div>

        <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 hover:border-blue-500/50 transition-colors group cursor-pointer" onClick={() => onNavigate(AppView.TREND_HUNTER)}>
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-500/20">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Trend Hunter</h3>
          <p className="text-gray-400 text-sm mb-4">Discover what's trending in your niche right now using real-time Google Search data.</p>
          <div className="flex items-center text-blue-500 text-sm font-medium">
            Find Trends <ArrowRight size={16} className="ml-1" />
          </div>
        </div>

        <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 hover:border-yellow-500/50 transition-colors group cursor-pointer" onClick={() => onNavigate(AppView.SCRIPT_WRITER)}>
          <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500 mb-4 group-hover:bg-yellow-500/20">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Script Writer</h3>
          <p className="text-gray-400 text-sm mb-4">Turn simple ideas into full, engaging scripts with hooks, content, and CTAs.</p>
          <div className="flex items-center text-yellow-500 text-sm font-medium">
            Write Script <ArrowRight size={16} className="ml-1" />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/50 rounded-xl p-8 border border-neutral-800 mt-8">
        <h3 className="text-lg font-bold mb-4">Growth Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <ul className="space-y-2 list-disc list-inside">
            <li>Focus on the first 30 seconds (The Hook).</li>
            <li>Thumbnails should be readable at small sizes.</li>
            <li>Reply to comments to boost engagement signals.</li>
          </ul>
          <ul className="space-y-2 list-disc list-inside">
            <li>Use playlists to increase session time.</li>
            <li>Check your "Audience Retention" graph weekly.</li>
            <li>Consistency beats intensity.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;