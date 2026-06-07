import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, AlertTriangle } from 'lucide-react';
import { createRoom, joinRoom, isFirebaseConfigured } from '../services/gameService';
import { motion } from 'framer-motion';

export default function Lobby() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const isDemoMode = !isFirebaseConfigured;

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      setError('Please enter your name first');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { roomId: newRoomId, playerId } = await createRoom(name.trim());
      sessionStorage.setItem('karuta_player_id', playerId);
      navigate(`/room/${newRoomId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!name.trim()) {
      setError('Please enter your name first');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const playerId = await joinRoom(roomId.trim().toUpperCase(), name.trim());
      sessionStorage.setItem('karuta_player_id', playerId);
      navigate(`/room/${roomId.trim().toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col justify-center">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Link>
      </div>

      {isDemoMode && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-200 text-sm">
            <strong>Demo Mode:</strong> Firebase chưa được cấu hình. 
            Room sẽ lưu tạm thờivà sẽ mất nếu xóa browser data. 
            Hãy cập nhật file .env để chơi online thật sự.
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Game Lobby</h2>

        {error && (
          <div className="p-3 mb-6 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow text-center font-bold text-lg"
              placeholder="Enter your nickname"
            />
          </div>

          <div className="pt-4 border-t border-slate-700">
            <button
              onClick={handleCreateRoom}
              disabled={isLoading || !name.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center transition-colors mb-4"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Room
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">OR</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-center font-mono uppercase"
                placeholder="ROOM ID"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                disabled={isLoading || !name.trim() || !roomId.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center transition-colors"
              >
                <Users className="w-5 h-5 mr-2" />
                Join
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
