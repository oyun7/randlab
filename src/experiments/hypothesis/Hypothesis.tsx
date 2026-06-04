import { useState, useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';

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

// χ²-таблица, df=5
const CHI2_LEVELS = [
  { max: 9.24,       label: 'p > 0.10', verdict: 'Кубик честный',           color: '#4ade80' },
  { max: 11.07,      label: 'p < 0.10', verdict: 'Слабые подозрения',        color: '#facc15' },
  { max: 15.09,      label: 'p < 0.05', verdict: '⚠️ Вероятно нечестный',  color: '#fb923c' },
  { max: Infinity,   label: 'p < 0.01', verdict: '🚨 Явно нечестный!',      color: '#f87171' },
];

function getVerdict(chi2: number) {
  return CHI2_LEVELS.find(l => chi2 <= l.max) ?? CHI2_LEVELS[CHI2_LEVELS.length - 1];
}

function weightedRoll(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i + 1;
  }
  return 6;
}

function clampCount(val: number, min: number, max: number, step: number = 1) {
  if (isNaN(val)) return min;
  const rounded = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, rounded));
}

export function Hypothesis() {
  const MIN = 30;
  const MAX = 100000;
  const STEP = 10;

  const [weights, setWeights]           = useState([1,1,1,1,1,1]);
  const [currentValue, setCurrentValue] = useState(120);
  const [inputValue, setInputValue]     = useState('120');
  const [results, setResults]           = useState<number[]>([]);
  const [running, setRunning]           = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      setResults(Array.from({ length: currentValue }, () => weightedRoll(weights)));
      setRunning(false);
    }, 700);
  };

  const reset = () => setResults([]);

  const setWeight = (i: number, v: number) => {
    setWeights(prev => { const next = [...prev]; next[i] = v; return next; });
    reset();
  };

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

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const realProbs   = weights.map(w => ((w / totalWeight) * 100).toFixed(0));

  const counts   = useMemo(
    () => [1,2,3,4,5,6].map(n => results.filter(x => x === n).length),
    [results],
  );
  const expected = results.length / 6;

  const chiSquare = useMemo(() => {
    if (!results.length || expected === 0) return 0;
    return counts.reduce((acc, c) => acc + (c - expected) ** 2 / expected, 0);
  }, [counts, expected]);

  const verdict = results.length ? getVerdict(chiSquare) : null;

  const chartData = useMemo(() => ({
    labels: ['1','2','3','4','5','6'],
    datasets: [
      {
        label: 'Наблюдаемые броски',
        data: counts,
        backgroundColor: 'rgba(167,139,250,0.8)',
      },
      {
        label: 'Ожидаемые (честный кубик)',
        data: Array(6).fill(expected),
        backgroundColor: 'rgba(52,211,153,0.3)',
      },
    ],
  }), [counts, expected]);

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Урок: Проверка гипотез и χ²-тест</div>
        <h2 className="exp-header__title">🧪 χ²-тест Пирсона</h2>
        <p className="exp-header__sub">
          Настрой веса граней кубика — сделай его «нечестным». Затем брось и
          посмотри: обнаружит ли χ²-тест подвох?
          H₀: кубик честный (каждая грань = 1/6).
        </p>
      </div>

      <div className="controls">
        <div>
          <div className="control-label" style={{ marginBottom: 10 }}>
            Веса граней (чем больше — тем чаще выпадает)
          </div>
          <div className="faces-grid">
            {[1,2,3,4,5,6].map((face, i) => (
              <div key={face} className="face-ctrl">
                <span>{face}</span>
                <input
                  type="range" min="1" max="10" value={weights[i]}
                  onChange={e => setWeight(i, +e.target.value)}
                />
                <div className="face-ctrl__pct">{realProbs[i]}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="control-row">
          <span className="control-label">Число бросков</span>
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
          <button className="btn-primary" onClick={run} disabled={running}>
            {running ? <><span className="spinner" /> Бросаем…</> : 'Бросить кубик'}
          </button>
          <button className="btn-ghost" onClick={reset} disabled={!results.length}>
            Сброс
          </button>
        </div>
      </div>

      <div className="callout">
        H₀: кубик честный. Формула: χ² = Σ(O−E)²/E, df = 5.
        Критическое значение α=0.05 → <strong>11.07</strong>.{' '}
        {weights.every(w => w === weights[0])
          ? 'Сейчас кубик честный — попробуй изменить веса!'
          : 'Кубик нечестный — поймает ли тест?'}
      </div>

      {!results.length ? (
        <div className="empty-state">
          <div className="empty-state__icon">🧪</div>
          <p>Настрой веса и брось кубик</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">Бросков</span>
              <span className="stat-chip__value">{results.length}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">χ²</span>
              <span className={`stat-chip__value ${chiSquare > 11.07 ? 'bad' : 'ok'}`}>
                {chiSquare.toFixed(2)}
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Критическое (α=0.05)</span>
              <span className="stat-chip__value">11.07</span>
            </div>
          </div>

          {verdict && (
            <div className="callout" style={{ borderLeftColor: verdict.color }}>
              <strong>Вердикт:</strong>{' '}
              <span style={{ color: verdict.color }}>{verdict.verdict}</span>
              {' '}— χ² = {chiSquare.toFixed(2)} ({verdict.label}).
              {chiSquare < 9.24
                ? ' Нет оснований отвергнуть H₀.'
                : chiSquare < 11.07
                ? ' Слабые подозрения, но формально H₀ не отвергается.'
                : ' H₀ отвергается — распределение значимо отличается от равномерного.'}
              {!weights.every(w => w === weights[0]) && chiSquare < 11.07
                ? ` 💡 Тест не поймал обман — увеличь число бросков!`
                : ''}
            </div>
          )}

          <div className="chart-box" style={{ height: 280 }}>
            <div className="chart-box__title">Наблюдаемые vs ожидаемые частоты</div>
            <div style={{ height: 230 }}>
              <Bar data={chartData} options={CHART_OPTS} />
            </div>
          </div>
        </>
      )}
    </>
  );
}