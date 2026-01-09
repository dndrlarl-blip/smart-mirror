import React, { useState } from 'react';
import FaceMeshFilter from './components/FaceMeshFilter';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [mode, setMode] = useState('camera'); // 'camera' or 'chat'

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Navigation */}
      <nav className="flex justify-center p-4 gap-4 bg-gray-900 border-b border-gray-800 z-50 relative">
        <button
          onClick={() => setMode('camera')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'camera'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg scale-105'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
        >
          📸 Face Filter
        </button>
        <button
          onClick={() => setMode('chat')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'chat'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg scale-105'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
        >
          💬 MiniMax Chat
        </button>
      </nav>

      {/* Content */}
      <main className="relative">
        {mode === 'camera' ? <FaceMeshFilter /> : <Chat />}
      </main>
    </div>
  );
}

export default App;
