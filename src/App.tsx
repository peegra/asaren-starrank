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
      <div className="tabs">
        <button
          type="button"
          className={`tab-button ${currentScreen === 'home' ? 'is-active' : ''}`}
          onClick={() => setCurrentScreen('home')}
        >
          <span aria-hidden="true">🏠</span>
          <span>HOME</span>
        </button>
        <button
          type="button"
          className={`tab-button ${currentScreen === 'mission' ? 'is-active' : ''}`}
          onClick={() => setCurrentScreen('mission')}
        >
          <span aria-hidden="true">⭐</span>
          <span>MISSION</span>
        </button>
        <button
          type="button"
          className={`tab-button ${currentScreen === 'ranking' ? 'is-active' : ''}`}
          onClick={() => setCurrentScreen('ranking')}
        >
          <span aria-hidden="true">🏆</span>
          <span>RANKING</span>
        </button>
      </div>
      <div className="flex-1 flex flex-col">{renderScreen()}</div>
    </div>
  );
}

export default App;
