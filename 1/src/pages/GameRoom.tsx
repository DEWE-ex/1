import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { subscribeToRoom, submitAnswer, GameState } from '../services/gameService';
import { Copy, LogOut, Trophy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  
  const playerId = sessionStorage.getItem('karuta_player_id');

  useEffect(() => {
    if (!roomId || !playerId) {
      navigate('/lobby');
      return;
    }

    const unsubscribe = subscribeToRoom(roomId, (state) => {
      if (!state) {
        setError('Room not found or has been closed.');
        return;
      }
      setGameState(state);
      
      if (state.status === 'finished' && state.winner) {
        const isWinner = state.winner === playerId;
        if (isWinner || state.winner === 'draw') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, playerId, navigate]);

  // Shuffle board answers once when game starts
  const boardCards = useMemo(() => {
    if (!gameState?.cards) return [];
    return [...gameState.cards].sort(() => 0.5 - Math.random());
  }, [gameState?.cards]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <Link to="/lobby" className="bg-slate-800 px-6 py-3 rounded-xl hover:bg-slate-700 transition-colors">
          Return to Lobby
        </Link>
      </div>
    );
  }

  if (!gameState) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const playersList = Object.values(gameState.players);
  const me = gameState.players[playerId!];
  const opponent = playersList.find(p => p.id !== playerId);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId || '');
    // simple toast could be added here
  };

  const handleCardClick = (cardId: string) => {
    if (gameState.status !== 'playing') return;
    const currentCard = gameState.cards[gameState.currentCardIndex];
    if (currentCard.id === cardId) {
      submitAnswer(roomId!, playerId!, cardId);
    } else {
      // Wrong answer logic could be added here (e.g., penalty)
    }
  };

  // Taken cards are those before currentCardIndex
  const takenCardIds = new Set(gameState.cards.slice(0, gameState.currentCardIndex).map(c => c.id));

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-5xl mx-auto">
      {/* Header Info */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/lobby')} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Leave">
            <LogOut className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <span className="text-slate-400 text-sm block">Room ID</span>
            <div className="flex items-center gap-2">
              <strong className="text-xl font-mono tracking-widest">{roomId}</strong>
              <button onClick={copyRoomId} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-slate-400 text-sm mb-1">{me?.name} (You)</div>
            <div className="text-2xl font-bold text-blue-400">{me?.score || 0}</div>
          </div>
          <div className="text-2xl font-black text-slate-600">VS</div>
          <div className="text-center">
            <div className="text-slate-400 text-sm mb-1">{opponent ? opponent.name : 'Waiting...'}</div>
            <div className="text-2xl font-bold text-red-400">{opponent?.score || 0}</div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center">
        {gameState.status === 'waiting' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-3xl font-bold mb-2">Waiting for opponent...</h2>
            <p className="text-slate-400">Share the Room ID to invite a friend.</p>
          </div>
        )}

        {gameState.status === 'playing' && (
          <div className="w-full flex flex-col items-center">
            {/* Clue Reader Area */}
            <div className="w-full max-w-2xl bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-indigo-500/30 p-8 rounded-3xl mb-8 text-center shadow-2xl">
              <span className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2 block">
                Card {gameState.currentCardIndex + 1} of {gameState.cards.length}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {gameState.cards[gameState.currentCardIndex].clue}
              </h2>
            </div>

            {/* Board Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {boardCards.map((card) => {
                const isTaken = takenCardIds.has(card.id);
                return (
                  <motion.button
                    key={card.id}
                    whileHover={!isTaken ? { scale: 1.05 } : {}}
                    whileTap={!isTaken ? { scale: 0.95 } : {}}
                    onClick={() => handleCardClick(card.id)}
                    disabled={isTaken}
                    className={`aspect-[3/4] rounded-xl p-4 flex items-center justify-center text-center text-lg font-bold shadow-lg transition-all duration-300
                      ${isTaken 
                        ? 'bg-slate-800 border-slate-700 text-slate-600 opacity-50 cursor-not-allowed scale-95' 
                        : 'bg-white text-slate-900 border-b-4 border-slate-300 hover:border-blue-400 hover:text-blue-600 cursor-pointer'
                      }`}
                  >
                    {card.answer}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {gameState.status === 'finished' && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <Trophy className="w-24 h-24 text-yellow-400 mb-6" />
            <h2 className="text-5xl font-black mb-4">
              {gameState.winner === 'draw' 
                ? "It's a Draw!" 
                : gameState.winner === playerId 
                  ? "You Won!" 
                  : `${opponent?.name} Won!`}
            </h2>
            <div className="text-xl text-slate-300 mb-8">
              Final Score: <span className="text-blue-400 font-bold">{me?.score}</span> - <span className="text-red-400 font-bold">{opponent?.score}</span>
            </div>
            <div className="flex gap-4">
              <Link to="/lobby" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold transition-colors">
                Play Again
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
