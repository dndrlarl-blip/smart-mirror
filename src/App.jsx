import React, { useState } from 'react';
import CameraSection from './components/CameraSection';
import NewsSection from './components/NewsSection';
import ChatSection from './components/ChatSection';

function App() {
  const [demographics, setDemographics] = useState({ gender: 'unknown', age: 0 });

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-2rem)]">
        {/* Left Section: Camera */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
          <CameraSection onDemographicsChange={setDemographics} />
        </div>

        {/* Right Section: News & Chat */}
        <div className="flex flex-col gap-4 h-full">
          {/* Top Right: News */}
          <div className="flex-1 bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800 overflow-y-auto">
            <NewsSection demographics={demographics} />
          </div>

          {/* Bottom Right: Chat */}
          <div className="flex-1 bg-gray-900 rounded-2xl p-4 shadow-xl border border-gray-800 flex flex-col overflow-hidden">
            <ChatSection />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
