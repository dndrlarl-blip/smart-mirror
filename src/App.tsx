import { useState } from 'react';
import { Layout } from './components/Layout';
import './App.css';

// Placeholders for now
import { FaceMeshContainer } from './features/facemesh/FaceMeshContainer';

import { ChatContainer } from './features/chat/ChatContainer';

function App() {
  const [activeTab, setActiveTab] = useState<'facemesh' | 'chat'>('facemesh');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'facemesh' ? <FaceMeshContainer /> : <ChatContainer />}
    </Layout>
  );
}

export default App;
