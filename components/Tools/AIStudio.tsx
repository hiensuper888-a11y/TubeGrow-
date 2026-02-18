import React, { useState } from 'react';
import { generateVeoVideo, generateSpeech, transcribeAudio, decodePCMData } from '../../services/geminiService';
import { Video, Mic, Volume2, Loader2, Play, Download, AlertTriangle, Wand2, FileAudio } from 'lucide-react';

const AIStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'tts' | 'transcribe'>('video');
  const [loading, setLoading] = useState(false);
  
  // Video State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // TTS State
  const [ttsText, setTtsText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Transcribe State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');

  // --- HANDLERS ---

  const handleVeoGen = async () => {
      if(!videoPrompt) return;
      setLoading(true);
      setVideoUrl(null);
      try {
          const url = await generateVeoVideo(videoPrompt, '16:9');
          setVideoUrl(url);
      } catch (e: any) {
          alert("Video Gen Error: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleTTS = async () => {
      if(!ttsText) return;
      setLoading(true);
      setAudioUrl(null);
      try {
          const base64Audio = await generateSpeech(ttsText, 'Kore');
          
          // Decode raw PCM from Gemini TTS (16-bit, 24kHz)
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const buffer = decodePCMData(base64Audio, audioCtx);
          
          // Play audio
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start();
          
          // Note: Since raw PCM has no header, we can't easily create a download link 
          // without an encoder library (like WAV encoder). For now, we just play it.
          // In a real app, you'd use a WAV encoder here to setAudioUrl.

      } catch (e: any) {
          alert("TTS Error: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleTranscribe = async () => {
      if(!audioFile) return;
      setLoading(true);
      try {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = (reader.result as string).split(',')[1];
              const text = await transcribeAudio(base64, audioFile.type);
              setTranscript(text);
          };
          reader.readAsDataURL(audioFile);
      } catch (e: any) {
          alert("Transcribe Error: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Wand2 className="text-purple-500" /> AI Studio
      </h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'video' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
              <Video size={18} /> Veo Video Gen
          </button>
          <button 
            onClick={() => setActiveTab('tts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'tts' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
              <Volume2 size={18} /> Text to Speech
          </button>
          <button 
            onClick={() => setActiveTab('transcribe')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'transcribe' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
              <Mic size={18} /> Audio Transcribe
          </button>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 min-h-[400px]">
          {/* VIDEO GEN */}
          {activeTab === 'video' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/20 mb-4">
                      <h3 className="text-purple-300 font-bold flex items-center gap-2 mb-2"><Video size={16} /> Veo 3.1 Fast</h3>
                      <p className="text-xs text-gray-400">Generates 720p video clips. Takes ~1-2 minutes.</p>
                  </div>
                  <textarea 
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="Describe the video... (e.g. A neon cyberpunk city with rain)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 h-32 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button 
                    onClick={handleVeoGen}
                    disabled={loading || !videoPrompt}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                      {loading ? <Loader2 className="animate-spin" /> : <Play size={18} />} Generate Video
                  </button>

                  {videoUrl && (
                      <div className="mt-8">
                          <video src={videoUrl} controls className="w-full rounded-xl shadow-2xl border border-white/10" />
                          <a href={videoUrl} download="veo-video.mp4" className="text-purple-400 text-sm mt-2 inline-block hover:underline">Download Video</a>
                      </div>
                  )}
              </div>
          )}

          {/* TTS */}
          {activeTab === 'tts' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 mb-4">
                      <h3 className="text-blue-300 font-bold flex items-center gap-2 mb-2"><Volume2 size={16} /> Gemini TTS</h3>
                      <p className="text-xs text-gray-400">High quality voice generation (Kore voice).</p>
                  </div>
                  <textarea 
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="Enter text to speak..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 h-32 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleTTS}
                    disabled={loading || !ttsText}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                      {loading ? <Loader2 className="animate-spin" /> : <Volume2 size={18} />} Generate Speech
                  </button>
              </div>
          )}

          {/* TRANSCRIBE */}
          {activeTab === 'transcribe' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/20 mb-4">
                      <h3 className="text-green-300 font-bold flex items-center gap-2 mb-2"><Mic size={16} /> Audio Transcription</h3>
                      <p className="text-xs text-gray-400">Upload audio to get text.</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FileAudio size={48} className="mx-auto text-gray-500 mb-2" />
                      <p className="text-gray-300 font-medium">{audioFile ? audioFile.name : "Click to Upload Audio"}</p>
                  </div>

                  <button 
                    onClick={handleTranscribe}
                    disabled={loading || !audioFile}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                      {loading ? <Loader2 className="animate-spin" /> : <Mic size={18} />} Transcribe
                  </button>

                  {transcript && (
                      <div className="bg-black/40 p-6 rounded-xl border border-white/10">
                          <h4 className="text-gray-400 text-sm font-bold uppercase mb-2">Transcript</h4>
                          <p className="text-gray-200 whitespace-pre-wrap">{transcript}</p>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default AIStudio;