import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateScript } from '../../services/geminiService';
import { FileText, Loader2 } from 'lucide-react';

const ScriptWriter: React.FC = () => {
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title) return;
    setLoading(true);
    try {
      const generatedScript = await generateScript(title, points);
      if (generatedScript) {
        setScript(generatedScript);
      }
    } catch (e) {
      alert("Error generating script. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
       <div className="flex-none">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <FileText className="text-yt-red" /> Script Writer
        </h2>
        
        <div className="bg-yt-gray p-6 rounded-xl border border-neutral-800 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Video Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yt-red focus:outline-none"
                placeholder="The Main Title of Your Video"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Key Points (Optional)</label>
              <textarea
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yt-red focus:outline-none h-24 resize-none"
                placeholder="What should be covered? e.g., Introduction, 3 main tips, Conclusion"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !title}
              className="w-full bg-yt-red hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <><Loader2 className="animate-spin mr-2" /> Writing Script...</> : 'Generate Script'}
            </button>
          </div>
        </div>
      </div>

      {script && (
        <div className="flex-1 min-h-0 bg-neutral-900 rounded-xl border border-neutral-800 p-6 overflow-y-auto custom-scrollbar">
          <article className="prose prose-invert prose-red max-w-none">
            <ReactMarkdown>{script}</ReactMarkdown>
          </article>
        </div>
      )}
    </div>
  );
};

export default ScriptWriter;