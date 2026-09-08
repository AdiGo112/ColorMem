import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateScore, generateTargetColor, hslString } from './scoring';
import Homepage from './Homepage';
import BubbleBackground from './BubbleBackground';

const TOTAL_ROUNDS = 5;
const PREVIEW_DURATION = 5;

// Phases: homepage → preview → guess → result → final
function App() {
  const [phase, setPhase] = useState('homepage');
  const [round, setRound] = useState(1);
  const [targetColor, setTargetColor] = useState({ h: 0, s: 50, l: 50 });
  const [guess, setGuess] = useState({ h: 180, s: 50, l: 50 });
  const [timer, setTimer] = useState(PREVIEW_DURATION);
  const [roundScore, setRoundScore] = useState(null);
  const [scores, setScores] = useState([]);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef(null);

  // ─── Start Game ──────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const color = generateTargetColor();
    setTargetColor(color);
    setGuess({ h: Math.floor(Math.random() * 360), s: Math.floor(Math.random() * 81) + 10, l: Math.floor(Math.random() * 61) + 20 });
    setRound(1);
    setScores([]);
    setRoundScore(null);
    setTimer(PREVIEW_DURATION);
    setAnimKey(k => k + 1);
    setPhase('preview');
  }, []);

  // ─── Preview Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'preview') return;

    if (timer <= 0) {
      setAnimKey(k => k + 1);
      setPhase('guess');
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimer(t => t - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [phase, timer]);

  // ─── Submit Guess ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const result = calculateScore(targetColor, guess);
    setRoundScore(result);
    setScores(prev => [...prev, { ...result, target: { ...targetColor }, guess: { ...guess } }]);
    setAnimKey(k => k + 1);
    setPhase('result');
  }, [targetColor, guess]);

  // ─── Next Round ──────────────────────────────────────────────────────────
  const nextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      setAnimKey(k => k + 1);
      setPhase('final');
      return;
    }
    const color = generateTargetColor();
    setTargetColor(color);
    setGuess({ h: Math.floor(Math.random() * 360), s: Math.floor(Math.random() * 81) + 10, l: Math.floor(Math.random() * 61) + 20 });
    setRound(r => r + 1);
    setRoundScore(null);
    setTimer(PREVIEW_DURATION);
    setAnimKey(k => k + 1);
    setPhase('preview');
  }, [round]);

  // ─── Back to Homepage ────────────────────────────────────────────────────
  const goHome = useCallback(() => {
    setPhase('homepage');
  }, []);

  // ─── Score Rating ────────────────────────────────────────────────────────
  const getScoreClass = (score, max = 10) => {
    const pct = score / max;
    if (pct >= 0.8) return 'score-excellent';
    if (pct >= 0.6) return 'score-good';
    if (pct >= 0.4) return 'score-ok';
    return 'score-poor';
  };

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  // ─── Slider Gradient Helpers ─────────────────────────────────────────────
  const hueGradient = `linear-gradient(to right,
    hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%),
    hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`;

  const satGradient = `linear-gradient(to right,
    hsl(${guess.h}, 0%, ${guess.l}%),
    hsl(${guess.h}, 100%, ${guess.l}%))`;

  const lightGradient = `linear-gradient(to right,
    hsl(${guess.h}, ${guess.s}%, 0%),
    hsl(${guess.h}, ${guess.s}%, 50%),
    hsl(${guess.h}, ${guess.s}%, 100%))`;

  const getSliderPercent = (value, max) => (value / max) * 100;

  // ─── Round Dots ──────────────────────────────────────────────────────────
  const renderRoundDots = () => (
    <div className="round-dots">
      {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
        <div
          key={i}
          className={`round-dot ${i < round - 1 ? 'completed' : ''} ${i === round - 1 ? 'active' : ''}`}
        />
      ))}
    </div>
  );

  // ─── Homepage ────────────────────────────────────────────────────────────
  if (phase === 'homepage') {
    return <Homepage onStartGame={startGame} />;
  }

  // ─── Game View ───────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <BubbleBackground />

      <div className="game-card" key={animKey}>
        {/* ─── Preview ────────────────────────────────────────────── */}
        {phase === 'preview' && (
          <div className="preview-phase phase-enter">
            <div className="round-header">
              <span className="round-label">Round {round} / {TOTAL_ROUNDS}</span>
              {renderRoundDots()}
            </div>
            <p className="memorize-label">Memorize this color</p>
            <div
              style={{
                backgroundColor: hslString(targetColor),
                width: '100%',
                height: '200px',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0
              }}
            ></div>
            <div className="timer-container">
              <div className="timer-bar">
                <div
                  className="timer-fill"
                  style={{ width: `${(timer / PREVIEW_DURATION) * 100}%` }}
                />
              </div>
              <div className="timer-text">
                {timer}<span>s</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Guess ──────────────────────────────────────────────── */}
        {phase === 'guess' && (
          <div className="guess-phase phase-enter">
            <div className="round-header">
              <span className="round-label">Round {round} / {TOTAL_ROUNDS}</span>
              {renderRoundDots()}
            </div>
            <div
              style={{
                backgroundColor: hslString(guess),
                width: '100%',
                height: '200px',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0
              }}
            ></div>
            <div className="sliders-container">
              {/* Hue Slider */}
              <div className="slider-group">
                <div className="slider-label">
                  <span className="slider-label-text">Hue</span>
                  <span className="slider-label-value">{guess.h}°</span>
                </div>
                <div className="slider-track">
                  <div className="slider-gradient" style={{ background: hueGradient }} />
                  <div
                    className="slider-thumb-visual"
                    style={{ left: `${getSliderPercent(guess.h, 359)}%` }}
                  />
                  <input
                    id="slider-hue"
                    type="range"
                    min="0"
                    max="359"
                    value={guess.h}
                    onChange={e => setGuess(g => ({ ...g, h: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Saturation Slider */}
              <div className="slider-group">
                <div className="slider-label">
                  <span className="slider-label-text">Saturation</span>
                  <span className="slider-label-value">{guess.s}%</span>
                </div>
                <div className="slider-track">
                  <div className="slider-gradient" style={{ background: satGradient }} />
                  <div
                    className="slider-thumb-visual"
                    style={{ left: `${getSliderPercent(guess.s, 100)}%` }}
                  />
                  <input
                    id="slider-saturation"
                    type="range"
                    min="0"
                    max="100"
                    value={guess.s}
                    onChange={e => setGuess(g => ({ ...g, s: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Lightness Slider */}
              <div className="slider-group">
                <div className="slider-label">
                  <span className="slider-label-text">Lightness</span>
                  <span className="slider-label-value">{guess.l}%</span>
                </div>
                <div className="slider-track">
                  <div className="slider-gradient" style={{ background: lightGradient }} />
                  <div
                    className="slider-thumb-visual"
                    style={{ left: `${getSliderPercent(guess.l, 100)}%` }}
                  />
                  <input
                    id="slider-lightness"
                    type="range"
                    min="0"
                    max="100"
                    value={guess.l}
                    onChange={e => setGuess(g => ({ ...g, l: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div className="submit-section">
              <button id="submit-guess" className="btn-primary" onClick={handleSubmit}>
                Submit Guess
              </button>
            </div>
          </div>
        )}

        {/* ─── Result ─────────────────────────────────────────────── */}
        {phase === 'result' && roundScore && (
          <div className="result-phase phase-enter">
            <div className="round-header">
              <span className="round-label">Round {round} / {TOTAL_ROUNDS}</span>
              {renderRoundDots()}
            </div>

            <div className="score-display">
              <div className={`score-value ${getScoreClass(roundScore.score)}`}>
                {roundScore.score.toFixed(2)}
              </div>
              <div className="score-max">out of 10</div>
            </div>

            <div className="delta-e-badge">
              ΔE <strong>{roundScore.deltaE}</strong>
            </div>

            <div className="color-comparison">
              <div className="color-compare-card">
                <div
                  className="color-compare-swatch"
                  style={{ backgroundColor: hslString(targetColor) }}
                />
                <div className="color-compare-label">Target</div>
              </div>
              <div className="color-compare-card">
                <div
                  className="color-compare-swatch"
                  style={{ backgroundColor: hslString(guess) }}
                />
                <div className="color-compare-label">Your Guess</div>
              </div>
            </div>

            <div className="result-actions">
              <button
                id="next-round"
                className="btn-primary"
                onClick={nextRound}
              >
                {round >= TOTAL_ROUNDS ? 'See Results' : 'Next Round →'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Final ──────────────────────────────────────────────── */}
        {phase === 'final' && (
          <div className="final-phase phase-enter">
            <div className="final-label">Final Score</div>
            <div className="final-score">{totalScore.toFixed(2)}</div>
            <div className="final-max">out of 50</div>

            <div className="round-breakdown">
              <div className="round-breakdown-title">Round Breakdown</div>
              <div className="breakdown-list">
                {scores.map((s, i) => (
                  <div key={i} className="breakdown-row">
                    <span className="breakdown-round-num">{i + 1}</span>
                    <div className="breakdown-swatch">
                      <div
                        className="breakdown-swatch-dot"
                        style={{ backgroundColor: hslString(s.target) }}
                      />
                      <div
                        className="breakdown-swatch-dot"
                        style={{ backgroundColor: hslString(s.guess) }}
                      />
                    </div>
                    <div className="breakdown-bar-container">
                      <div
                        className="breakdown-bar"
                        style={{ width: `${(s.score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="breakdown-score">
                      {s.score.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="final-actions">
              <button id="play-again" className="btn-primary" onClick={goHome}>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
