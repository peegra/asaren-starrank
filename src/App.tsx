import { useState } from 'react';
import Home from './components/Home';
import Mission from './components/Mission';
import Ranking from './components/Ranking';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'mission' | 'ranking'>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Home />;
      case 'mission':
        return <Mission />;
      case 'ranking':
        return <Ranking />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="app min-h-screen flex flex-col">
      <div className="flex items-center justify-center" style={{ marginTop: '12px', marginBottom: '12px' }}>
        <img
          src={`${import.meta.env.BASE_URL}stacle.png`}
          alt="STACLE"
          style={{ maxWidth: '720px', height: 'auto' }}
        />
      </div>
      <div className="tabs">
        <button
          type="button"
          className={`tab-button ${currentScreen === 'home' ? 'is-active' : ''}`}
          onClick={() => setCurrentScreen('home')}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{ fontSize: '1.6rem' }}>HOME</span>
        </button>
        <button
          type="button"
          className={`tab-button ${currentScreen === 'mission' ? 'is-active' : ''}`}
          onClick={() => setCurrentScreen('mission')}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16l-6 3.4L7.5 13 2.5 8.6l6.6-.6L12 2z"/>
          </svg>
          <span style={{ fontSize: '1.6rem' }}>MISSION</span>
        </button>
        <button
          type="button"
          className={`tab-button ${currentScreen === 'ranking' ? 'is-active' : ''}`}
          onClick={() => setCurrentScreen('ranking')}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"/>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
          </svg>
          <span style={{ fontSize: '1.6rem' }}>RANKING</span>
        </button>
      </div>
      <div className="flex-1 flex flex-col">{renderScreen()}</div>
    </div>
  );
}

export default App;
