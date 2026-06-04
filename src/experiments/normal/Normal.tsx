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

function gaussianCurve(mu: number, sigma: number, xs: number[], scale: number) {
  return xs.map(x =>
    scale * (1 / (sigma * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * ((x - mu) / sigma) ** 2),
  );
}

function clampCount(val: number, min: number, max: number, step: number = 1) {
  if (isNaN(val)) return min;
  const rounded = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, rounded));
}

export function Normal() {
  const MIN = 50;
  const MAX = 100000;
  const STEP = 10;

  const [numDice, setNumDice]           = useState(2);
  const [currentValue, setCurrentValue] = useState(500);
  const [inputValue, setInputValue]     = useState('500');
  const [results, setResults]           = useState<number[]>([]);
  const [running, setRunning]           = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      const arr: number[] = [];
      for (let i = 0; i < currentValue; i++) {
        let s = 0;
        for (let d = 0; d < numDice; d++) s += Math.floor(Math.random() * 6) + 1;
        arr.push(s);
      }
      setResults(arr);
      setRunning(false);
    }, 600);
  };

  const reset = () => setResults([]);

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

  const minVal = numDice;
  const maxVal = numDice * 6;

  const freqs = useMemo(() => {
    const f: Record<number, number> = {};
    for (let v = minVal; v <= maxVal; v++) f[v] = 0;
    results.forEach(r => { if (r in f) f[r]++; });
    return f;
  }, [results, minVal, maxVal]);

  const labels      = Array.from({ length: maxVal - minVal + 1 }, (_, i) => String(minVal + i));
  const counts      = labels.map(l => freqs[+l] ?? 0);
  const mu          = numDice * 3.5;
  const sigma       = Math.sqrt(numDice * 35 / 12);
  const gaussValues = gaussianCurve(mu, sigma, labels.map(Number), currentValue);

  const mean = results.length
    ? (results.reduce((a, b) => a + b, 0) / results.length).toFixed(2)
    : null;

  const stdDev = useMemo(() => {
    if (!results.length) return null;
    const m = results.reduce((a, b) => a + b, 0) / results.length;
    return Math.sqrt(
      results.reduce((acc, x) => acc + (x - m) ** 2, 0) / results.length,
    ).toFixed(2);
  }, [results]);

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Факт (частота)',
        data: counts,
        backgroundColor: 'rgba(250,204,21,0.55)',
        borderColor:     'rgba(250,204,21,0.9)',
        borderWidth: 1,
      },
      {
        type: 'line' as const,
        label: 'Нормальная кривая',
        data: gaussValues,
        borderColor: '#f472b6',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  }), [counts, gaussValues, labels]);

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Урок: Нормальное распределение</div>
        <h2 className="exp-header__title">🔔 Центральная предельная теорема</h2>
        <p className="exp-header__sub">
          Бросай несколько кубиков и смотри на сумму. Уже при 2 кубиках появляется
          колокол — это ЦПТ: сумма независимых случайных величин стремится к нормальному распределению.
        </p>
      </div>

      <div className="controls">
        <div className="control-row">
          <span className="control-label">Число кубиков</span>
          <input
            type="range" min="1" max="8" value={numDice}
            onChange={e => { setNumDice(+e.target.value); reset(); }}
          />
          <span className="control-value">{numDice} 🎲</span>
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
            {running ? <><span className="spinner" /> Симуляция…</> : 'Запустить'}
          </button>
          <button className="btn-ghost" onClick={reset} disabled={!results.length}>
            Сброс
          </button>
        </div>
      </div>

      <div className="callout">
        При <strong>{numDice}</strong> кубик(ах): теоретическое
        μ = <strong>{mu.toFixed(1)}</strong>,
        σ = <strong>{sigma.toFixed(2)}</strong>.{' '}
        {numDice === 1
          ? 'При 1 кубике — равномерное распределение, никакого колокола.'
          : numDice <= 3
          ? 'Колокол уже виден, но с заметными неровностями.'
          : 'Распределение почти неотличимо от нормального!'}
      </div>

      {!results.length ? (
        <div className="empty-state">
          <div className="empty-state__icon">🔔</div>
          <p>Выбери число кубиков и нажми «Запустить»</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">Бросков</span>
              <span className="stat-chip__value">{results.length}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Среднее (факт)</span>
              <span className="stat-chip__value">{mean}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">σ факт</span>
              <span className="stat-chip__value">{stdDev}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">μ теория</span>
              <span className="stat-chip__value">{mu.toFixed(1)}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">σ теория</span>
              <span className="stat-chip__value">{sigma.toFixed(2)}</span>
            </div>
          </div>

          <div className="chart-box" style={{ height: 300 }}>
            <div className="chart-box__title">
              Распределение суммы {numDice} кубик(ов) — {results.length} бросков
            </div>
            <div style={{ height: 250 }}>
              <Bar data={chartData as any} options={CHART_OPTS} />
            </div>
          </div>
        </>
      )}
    </>
  );
}