import React, { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Tools/Dashboard';
import Optimizer from './components/Tools/Optimizer';
import ScriptWriter from './components/Tools/ScriptWriter';
import TrendHunter from './components/Tools/TrendHunter';
import ThumbnailRater from './components/Tools/ThumbnailRater';
import { AppView } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case AppView.OPTIMIZER:
        return <Optimizer />;
      case AppView.SCRIPT_WRITER:
        return <ScriptWriter />;
      case AppView.TREND_HUNTER:
        return <TrendHunter />;
      case AppView.THUMBNAIL_RATER:
        return <ThumbnailRater />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-yt-dark text-white flex overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-neutral-800 bg-yt-gray">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <span className="ml-2 font-bold text-lg">TubeGrow AI</span>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;