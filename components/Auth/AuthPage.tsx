import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Sparkles, Play } from 'lucide-react';
import { Language } from '../../types';

const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for effect
    setTimeout(() => {
      login(email, name || email.split('@')[0]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505] font-sans selection:bg-yt-red selection:text-white">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] animate-float opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] animate-float-delayed opacity-60"></div>
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[80px] animate-pulse-slow"></div>
      </div>

      <div className="z-10 w-full max-w-[440px] p-6">
        
        {/* Brand Section */}
        <div className="text-center mb-10 animate-fade-in-up">
           <div className="relative inline-block group mb-5">
               {/* Glow Behind */}
               <div className="absolute inset-0 bg-red-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse-slow"></div>
               
               {/* Main Logo Box */}
               <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500 to-red-700 border border-white/10 shadow-2xl mx-auto transform transition-transform group-hover:scale-110 duration-500 group-hover:rotate-3">
                  {/* Inner Shadow/Highlight */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  
                  {/* Play Icon */}
                  <div className="relative w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10">
                    <Play size={40} fill="white" className="text-white ml-2 drop-shadow-lg" strokeWidth={0} />
                  </div>
               </div>
           </div>
           
           <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-100 to-gray-500 mb-2 drop-shadow-xl">
             TubeGrow<span className="text-yt-red">AI</span>
           </h1>
           <div className="flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase text-gray-500">
              <span className="h-[1px] w-8 bg-gray-700"></span>
              <span className="text-yt-red font-bold">{t.auth.byAuthor}</span>
              <span className="h-[1px] w-8 bg-gray-700"></span>
           </div>
        </div>

        {/* Auth Card */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl animate-fade-in backdrop-blur-2xl ring-1 ring-white/10 relative overflow-hidden">
          {/* Subtle sheen effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
          
          <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
            {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
            {!isLogin && <Sparkles size={20} className="text-yellow-400 animate-pulse" />}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5 group">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wide group-focus-within:text-yt-red transition-colors">{t.auth.nameLabel}</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-yt-red transition-colors duration-300" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yt-red/50 focus:bg-black/60 focus:ring-1 focus:ring-yt-red transition-all duration-300"
                    placeholder="Mr. Creator"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 group">
              <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wide group-focus-within:text-yt-red transition-colors">{t.auth.emailLabel}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-yt-red transition-colors duration-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yt-red/50 focus:bg-black/60 focus:ring-1 focus:ring-yt-red transition-all duration-300"
                  placeholder="creator@tubegrow.ai"
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wide group-focus-within:text-yt-red transition-colors">{t.auth.passwordLabel}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-yt-red transition-colors duration-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yt-red/50 focus:bg-black/60 focus:ring-1 focus:ring-yt-red transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yt-red to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transform hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 mt-8 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? t.auth.loginBtn : t.auth.registerBtn}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
            >
              {isLogin ? t.auth.switchToRegister : t.auth.switchToLogin}
            </button>
          </div>
        </div>

        {/* Language Selector Footer */}
        <div className="mt-8 flex justify-center items-center gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 w-fit mx-auto">
          {(['en', 'vi', 'zh', 'ja'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 uppercase ${
                language === lang ? 'bg-yt-red text-white shadow-lg transform scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;