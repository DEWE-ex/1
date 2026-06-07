import { Link } from 'react-router-dom';
import { Swords, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 tracking-tighter">
          KARUTA CLASH
        </h1>
        <p className="text-slate-400 text-lg">1vs1 Realtime Card Game</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">
        <Link to="/lobby" className="flex-1 group">
          <div className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-red-500 transition-all rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer">
            <Swords className="w-16 h-16 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">Play 1vs1</h2>
            <p className="text-slate-400 text-sm">Join a room or create one to battle your friends.</p>
          </div>
        </Link>
        
        <Link to="/contribute" className="flex-1 group">
          <div className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-blue-500 transition-all rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer">
            <PlusCircle className="w-16 h-16 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">Contribute</h2>
            <p className="text-slate-400 text-sm">Add new cards and questions to the global deck.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
