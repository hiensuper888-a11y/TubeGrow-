import React, { useState, Suspense } from 'react';
import Sidebar from './components/Layout/Sidebar';
import AuthPage from './components/Auth/AuthPage';
import SettingsModal from './components/Settings/SettingsModal';
import { AppView } from './types';
import { Menu, Loader2 } from 'lucide-react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy load components
const Dashboard = React.lazy(() => import('./components/Tools/Dashboard'));
const Optimizer = React.lazy(() => import('./components/Tools/Optimizer'));
const ScriptWriter = React.lazy(() => import('./components/Tools/ScriptWriter'));
const TrendHunter = React.lazy(() => import('./components/Tools/TrendHunter'));
const ThumbnailRater = React.lazy(() => import('./components/Tools/ThumbnailRater'));
const ThumbnailMaker = React.lazy(() => import('./components/Tools/ThumbnailMaker'));
const VideoAudit = React.lazy(() => import('./components/Tools/VideoAudit'));
const ViralStrategy = React.lazy(() => import('./components/Tools/ViralStrategy'));
const ChannelManager = React.lazy(() => import('./components/Tools/ChannelManager'));
const ChatAssistant = React.lazy(() => import('./components/Tools/ChatAssistant'));
const AIStudio = React.lazy(() => import('./components/Tools/AIStudio'));

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeVideoData, setActiveVideoData] = useState<{ url?: string; topic?: string }>({});

  // Show loading screen
  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#080808] text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-yt-red" size={48} />
                <p className="text-gray-500 font-medium animate-pulse">Initializing TubeGrow AI...</p>
            </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleNavigate = (view: AppView, data?: any) => {
    if (data) {
      setActiveVideoData(data);
    }
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={handleNavigate} />;
      case AppView.CHANNEL_MANAGER:
        return <ChannelManager onNavigate={handleNavigate} />;
      case AppView.OPTIMIZER:
        return <Optimizer />;
      case AppView.SCRIPT_WRITER:
        return <ScriptWriter />;
      case AppView.TREND_HUNTER:
        return <TrendHunter />;
      case AppView.THUMBNAIL_RATER:
        return <ThumbnailRater />;
      case AppView.THUMBNAIL_MAKER:
        return <ThumbnailMaker />;
      case AppView.VIDEO_AUDIT:
        return <VideoAudit initialUrl={activeVideoData.url} />;
      case AppView.VIRAL_STRATEGY:
        return <ViralStrategy initialTopic={activeVideoData.topic || activeVideoData.url} onNavigate={handleNavigate} />;
      case AppView.CHAT_ASSISTANT:
        return <ChatAssistant />;
      case AppView.AI_STUDIO:
        return <AIStudio />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex overflow-hidden font-sans selection:bg-yt-red selection:text-white relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-800/10 rounded-full blur-[120px] animate-float opacity-50"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-900/10 rounded-full blur-[130px] animate-float-delayed opacity-40"></div>
          <div className="absolute top-[40%] left-[40%] w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[100px] animate-pulse-slow"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
            setActiveVideoData({});
        }}
        isOpen={isMobileMenuOpen}
        onOpenSettings={() => {
            setIsSettingsOpen(true);
            setIsMobileMenuOpen(false);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <div className="md:hidden flex items-center p-4 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-300 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="ml-3 font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">TubeGrow AI</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
          <div className="animate-fade-in max-w-7xl mx-auto">
             <Suspense fallback={
                <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-yt-red" size={48} />
                        <p className="text-gray-500 text-sm font-medium animate-pulse">Loading Module...</p>
                    </div>
                </div>
             }>
                {renderView()}
             </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;