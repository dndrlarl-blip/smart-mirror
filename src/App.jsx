import React from 'react';
import FaceFilter from './components/FaceFilter';

function App() {
  return (
    <div className="app-main">
      <header className="app-header">
        <h1>FaceMesh AR Studio</h1>
        <p>Real-time Face Tracking & filtering</p>
      </header>
      <main>
        <FaceFilter />
      </main>
    </div>
  );
}

export default App;
