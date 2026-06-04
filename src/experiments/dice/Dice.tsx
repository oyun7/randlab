import { useState, useMemo, useCallback, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { useSimulation } from '../../hooks/useSimulation';

const FACE_TRANSFORMS = [
  'translateZ(40px)',
  'rotateY(90deg) translateZ(40px)',
  'rotateY(180deg) translateZ(40px)',
  'rotateY(-90deg) translateZ(40px)',
  'rotateX(90deg) translateZ(40px)',
  'rotateX(-90deg) translateZ(40px)',
];

const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0,   y: 0   },
  2: { x: 0,   y: -90 },
  3: { x: 0,   y: 180 },
  4: { x: 0,   y: 90  },
  5: { x: -90, y: 0   },
  6: { x: 90,  y: 0   },
};

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { size: 12 } } },
  },
  scales: {
    x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
} as const;

const DICE_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6];

function clampCount(val: number, min: number, max: number, step: number = 1) {
  if (isNaN(val)) return min;
  const rounded = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, rounded));
}

type DieRotation = { x: number; y: number };

export function Dice() {
  const MIN = 1;
  const MAX = 100000;
  const STEP = 1;

  const [numDice, setNumDice]           = useState(1);
  const [currentValue, setCurrentValue] = useState(100);
  const [inputValue, setInputValue]     = useState('100');
  const [rotations, setRotations]       = useState<DieRotation[]>([{ x: 0, y: 0 }]);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generator = useCallback(
    () => Math.floor(Math.random() * 6) + 1,
    [],
  );
  const { data, run, reset, isAnimating } = useSimulation<number>(generator);

  /* ── dice count selector ── */
  const handleSelectDice = (n: number) => {
    setNumDice(n);
    setRotations(Array.from({ length: n }, (_, i) => rotations[i] ?? { x: 0, y: 0 }));
  };

  /* ── simulation count input ── */
  const applyInput = () => {
    const parsed = parseFloat(inputValue);
    const validated = clampCount(parsed, MIN, MAX, STEP);
    setCurrentValue(validated);
    setInputValue(String(validated));
  };

  const changeValue = (delta: number) => {
    const newValue = clampCount(currentValue + delta, MIN, MAX, STEP);
    setCurrentValue(newValue);
    setInputValue(String(newValue));
  };

  const startHold = (delta: number) => {
    changeValue(delta);
    holdRef.current = setInterval(() => {
      setCurrentValue(prev => {
        const newValue = clampCount(prev + delta, MIN, MAX, STEP);
        setInputValue(String(newValue));
        return newValue;
      });
    }, 120);
  };

  const stopHold = () => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  };

  /* ── roll ── */
  const roll = () => {
    setRotations(prev =>
      prev.map((r, i) => {
        const result = Math.floor(Math.random() * 6) + 1;
        const xSpin  = (4 + Math.floor(Math.random() * 3 + i % 3)) * 360;
        const ySpin  = (5 + Math.floor(Math.random() * 4 + i % 2)) * 360;
        const target = FACE_ROTATIONS[result];
        return { x: r.x + xSpin + target.x, y: r.y + ySpin + target.y };
      }),
    );
    run(currentValue * numDice);
  };

  /* ── stats ── */
  const counts = useMemo(
    () => [1, 2, 3, 4, 5, 6].map(n => data.filter(x => x === n).length),
    [data],
  );
  const expected  = data.length / 6;
  const mean      = data.length
    ? (data.reduce((a, b) => a + b, 0) / data.length).toFixed(2)
    : null;
  const mostFreq  = counts.indexOf(Math.max(...counts)) + 1;

  const avgSum = useMemo(() => {
    if (!data.length || numDice < 2) return null;
    const rolls = Math.floor(data.length / numDice);
    if (!rolls) return null;
    const total = data.slice(0, rolls * numDice).reduce((a, b) => a + b, 0);
    return (total / rolls).toFixed(2);
  }, [data, numDice]);

  const chartData = useMemo(() => ({
    labels: ['1', '2', '3', '4', '5', '6'],
    datasets: [
      { label: 'Факт',   data: counts,             backgroundColor: 'rgba(56,189,248,0.8)' },
      { label: 'Теория', data: Array(6).fill(expected), backgroundColor: 'rgba(52,211,153,0.35)' },
    ],
  }), [counts, expected]);

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Урок: Кубик и шансы</div>
        <h2 className="exp-header__title">🎲 Кубики</h2>
        <p className="exp-header__sub">
          Бросай кубики и следи за распределением выпавших граней.
        </p>
      </div>

      {/* ── dice count picker ── */}
      <div className="controls">
        <div className="control-row">
          <span className="control-label">Кубиков</span>
          <div className="dice-count-picker">
            {DICE_COUNT_OPTIONS.map(n => (
              <button
                key={n}
                className={`dice-count-btn ${numDice === n ? 'active' : ''}`}
                onClick={() => handleSelectDice(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3-D dice stage ── */}
      <div className="scene scene--multi">
        {rotations.slice(0, numDice).map((rot, i) => (
          <div key={i} className="cube" style={{
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            transition: isAnimating
              ? `transform ${1.1 + i * 0.07}s cubic-bezier(0.25,0.1,0.25,1)`
              : 'none',
          }}>
            {[1, 2, 3, 4, 5, 6].map((face, fi) => (
              <div
                key={face}
                className="cube__face"
                style={{ transform: FACE_TRANSFORMS[fi] }}
              >
                {face}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── simulation count control ── */}
      <div className="controls">
        <div className="control-row">
          <span className="control-label">Бросков за раз</span>
          <div className="num-stepper">
            <button
              className="num-stepper__arrow"
              onMouseDown={() => startHold(-STEP)}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={() => startHold(-STEP)}
              onTouchEnd={stopHold}
              disabled={currentValue <= MIN}
              aria-label="Уменьшить"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <input
              className="num-stepper__input"
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={applyInput}
              onKeyDown={e => {
                if (e.key === 'Enter') applyInput();
                if (e.key === 'ArrowUp') { e.preventDefault(); changeValue(STEP); }
                if (e.key === 'ArrowDown') { e.preventDefault(); changeValue(-STEP); }
              }}
            />
            <button
              className="num-stepper__arrow"
              onMouseDown={() => startHold(STEP)}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={() => startHold(STEP)}
              onTouchEnd={stopHold}
              disabled={currentValue >= MAX}
              aria-label="Увеличить"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="control-btns">
          <button className="btn-primary" onClick={roll} disabled={isAnimating}>
            {isAnimating
              ? <><span className="spinner" /> Бросаем…</>
              : 'Бросить кубик'}
          </button>
          <button className="btn-ghost" onClick={reset} disabled={!data.length}>
            Сброс
          </button>
        </div>
      </div>

      {!data.length ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎲</div>
          <p>Нажми «Бросить кубик» и посмотри на распределение</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">Всего бросков</span>
              <span className="stat-chip__value">{data.length}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Среднее</span>
              <span className="stat-chip__value">{mean}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Лидер</span>
              <span className="stat-chip__value">🎲 {mostFreq}</span>
            </div>
            {numDice > 1 && avgSum !== null && (
              <div className="stat-chip">
                <span className="stat-chip__label">Средняя сумма</span>
                <span className="stat-chip__value">{avgSum}</span>
              </div>
            )}
          </div>

          <div className="chart-box" style={{ height: 260 }}>
            <div className="chart-box__title">Частоты выпадения граней</div>
            <div style={{ height: 210 }}>
              <Bar data={chartData} options={CHART_OPTS} />
            </div>
          </div>
        </>
      )}
    </>
  );
}