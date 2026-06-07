import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { addCard } from '../services/gameService';
import { motion } from 'framer-motion';

export default function Contribute() {
  const [clue, setClue] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clue.trim() || !answer.trim()) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      await addCard(clue.trim(), answer.trim());
      setMessage({ text: 'Card added successfully!', type: 'success' });
      setClue('');
      setAnswer('');
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Failed to add card. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col">
      <div className="mb-8 mt-4">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-2">Contribute a Card</h2>
        <p className="text-slate-400 mb-8">Add a new question and answer to the global Karuta deck.</p>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Clue / Question
            </label>
            <textarea
              required
              rows={3}
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
              placeholder="e.g., What is the capital of Japan?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Answer (The text on the card)
            </label>
            <input
              type="text"
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="e.g., Tokyo"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !clue.trim() || !answer.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center transition-colors"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Card
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
