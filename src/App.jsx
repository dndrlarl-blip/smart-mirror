import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [showWeather, setShowWeather] = useState(true);
  const [showNews, setShowNews] = useState(true);
  const [showClock, setShowClock] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const videoRef = useRef(null);

  // Handle Resize for Responsive transitions
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Webcam (Desktop Only)
  useEffect(() => {
    let stream = null;

    const startWebcam = async () => {
      if (!isMobile) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing webcam:", err);
        }
      }
    };

    const stopWebcam = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    };

    if (!isMobile) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => stopWebcam();
  }, [isMobile]);

  // Current Time for Clock Component
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`app-container ${isMobile ? 'mobile-mode' : 'desktop-mode'}`}>
      
      {/* Desktop Mode: Smart Mirror Interface */}
      {!isMobile && (
        <div className="mirror-view">
          <video ref={videoRef} autoPlay playsInline muted className="webcam-video" />
          
          <div className="mirror-overlay">
             {/* 3-Column Grid Layout */}
            <div className="mirror-grid">
              
              {/* Left Column: Clock & Date */}
              <div className="grid-col left-col">
                {showClock && (
                  <div className="widget clock-widget">
                    <h1>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h1>
                    <p>{time.toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Center Column: Empty for simple reflection or notifications */}
              <div className="grid-col center-col">
                {/* Space for reflection */}
              </div>

              {/* Right Column: Weather & News */}
              <div className="grid-col right-col">
                {showWeather && (
                    <div className="widget weather-widget">
                      <h2>Seoul, KR</h2>
                      <div className="weather-icon">☀️ 24°C</div>
                      <p>Sunny throughout the day.</p>
                    </div>
                )}
                
                {showNews && (
                  <div className="widget news-widget">
                    <h3>Breaking News</h3>
                    <ul>
                      <li>AI Transforms Smart Mirrors</li>
                      <li>Global Tech Trends 2026</li>
                      <li>Makeathon Winners Announced</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Mode: Remote Control Interface */}
      {isMobile && (
        <div className="remote-view">
          <header className="remote-header">
            <h2>Smart Remote</h2>
            <p>Control your mirror</p>
          </header>
          
          <div className="remote-controls">
            <button 
              className={`remote-btn ${showClock ? 'active' : ''}`} 
              onClick={() => setShowClock(!showClock)}
            >
              <span className="icon">⏰</span>
              <span className="label">Clock {showClock ? 'ON' : 'OFF'}</span>
            </button>

            <button 
              className={`remote-btn ${showWeather ? 'active' : ''}`} 
              onClick={() => setShowWeather(!showWeather)}
            >
               <span className="icon">🌦️</span>
               <span className="label">Weather {showWeather ? 'ON' : 'OFF'}</span>
            </button>

            <button 
              className={`remote-btn ${showNews ? 'active' : ''}`} 
              onClick={() => setShowNews(!showNews)}
            >
               <span className="icon">📰</span>
               <span className="label">News {showNews ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}


export default App
