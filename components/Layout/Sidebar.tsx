import React from 'react';
import { LayoutDashboard, Wand2, FileText, TrendingUp, Image as ImageIcon } from 'lucide-react';
import { AppView } from '../../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.OPTIMIZER, label: 'Video Optimizer', icon: Wand2 },
    { id: AppView.SCRIPT_WRITER, label: 'Script Writer', icon: FileText },
    { id: AppView.TREND_HUNTER, label: 'Trend Hunter', icon: TrendingUp },
    { id: AppView.THUMBNAIL_RATER, label: 'Thumbnail Rater', icon: ImageIcon },
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-yt-gray border-r border-neutral-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0`}
    >
      <div className="flex items-center justify-center h-16 border-b border-neutral-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-yt-red text-2xl">▶</span> TubeGrow AI
        </h1>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-yt-red text-white font-medium shadow-lg shadow-red-900/20' 
                  : 'text-gray-400 hover:bg-yt-hover hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-neutral-800">
        <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
          <p className="text-xs text-gray-500 text-center">
            AI-Powered Organic Growth
            <br />
            Powered by Gemini 3 & 2.5
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;