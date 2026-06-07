import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Contribute from './pages/Contribute';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/room/:roomId" element={<GameRoom />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
