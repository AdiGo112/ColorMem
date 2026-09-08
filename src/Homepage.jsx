import BubbleBackground from './BubbleBackground';

export default function Homepage({ onStartGame }) {
  return (
    <div className="homepage">
      <BubbleBackground interactive />
      <div className="homepage-content">
        <div className="homepage-badge">COLOR PERCEPTION GAME</div>
        <h1 className="homepage-title">
          <span className="title-color" style={{ '--hue': 270 }}>C</span>
          <span className="title-color" style={{ '--hue': 330 }}>o</span>
          <span className="title-color" style={{ '--hue': 30 }}>l</span>
          <span className="title-color" style={{ '--hue': 60 }}>o</span>
          <span className="title-color" style={{ '--hue': 150 }}>r</span>
          <span className="title-color" style={{ '--hue': 200 }}>M</span>
          <span className="title-color" style={{ '--hue': 240 }}>e</span>
          <span className="title-color" style={{ '--hue': 300 }}>m</span>
        </h1>
        <p className="homepage-desc">
          See a color. Remember it. Recreate it from memory.<br />
          Scored using perceptual color science — not just slider math.
        </p>
        <div className="homepage-stats">
          <div className="stat-item">
            <span className="stat-num">5</span>
            <span className="stat-label">Rounds</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">50</span>
            <span className="stat-label">Max Score</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">ΔE</span>
            <span className="stat-label">Scoring</span>
          </div>
        </div>
        <button id="homepage-start" className="homepage-btn" onClick={onStartGame}>
          <span>Start Game</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <p className="homepage-hint">Click and drag to play with the bubbles ✨</p>
      </div>
    </div>
  );
}
