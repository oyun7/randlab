import { useState, useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { size: 12 } } },
  },
  scales: {
    x: {
      title: { display: true, text: 'Человек в группе',
        color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
      ticks: { color: 'rgba(255,255,255,0.5)' },
      grid:  { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      min: 0, max: 100,
      title: { display: true, text: '% совпадений',
        color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
      ticks: { color: 'rgba(255,255,255,0.5)', callback: (v: any) => v + '%' },
      grid:  { color: 'rgba(255,255,255,0.05)' },
    },
  },
} as const;

function theoreticalBirthday(n: number): number {
  let p = 1;
  for (let i = 0; i < n; i++) p *= (365 - i) / 365;
  return (1 - p) * 100;
}

function hasMatch(n: number): boolean {
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    const b = Math.floor(Math.random() * 365);
    if (seen.has(b)) return true;
    seen.add(b);
  }
  return false;
}

function clampCount(val: number, min: number, max: number, step: number = 1) {
  if (isNaN(val)) return min;
  const rounded = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, rounded));
}

export function Birthday() {
  const MIN = 100;
  const MAX = 100000;
  const STEP = 10;

  const [groupSize, setGroupSize]       = useState(23);
  const [currentValue, setCurrentValue] = useState(1000);
  const [inputValue, setInputValue]     = useState('1000');
  const [results, setResults]           = useState<{ n: number; experimental: number }[]>([]);
  const [running, setRunning]           = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      const data = [];
      for (let n = 2; n <= groupSize; n++) {
        let hits = 0;
        for (let s = 0; s < currentValue; s++) if (hasMatch(n)) hits++;
        data.push({ n, experimental: (hits / currentValue) * 100 });
      }
      setResults(data);
      setRunning(false);
    }, 800);
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

  const theoretical = useMemo(
    () => Array.from({ length: groupSize - 1 }, (_, i) => theoreticalBirthday(i + 2)),
    [groupSize],
  );

  const labels = Array.from({ length: groupSize - 1 }, (_, i) => String(i + 2));

  // Найти n, при котором теория пересекает 50%
  let crossAt = 23;
  for (let n = 2; n <= 100; n++) {
    if (theoreticalBirthday(n) >= 50) { crossAt = n; break; }
  }

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Симуляция',
        data: results.map(r => +r.experimental.toFixed(1)),
        borderColor: '#f472b6', borderWidth: 2, pointRadius: 2, tension: 0.3,
      },
      {
        label: 'Теория',
        data: theoretical.map(v => +v.toFixed(2)),
        borderColor: '#a78bfa', borderDash: [5, 4], borderWidth: 2, pointRadius: 0, tension: 0.4,
      },
      {
        label: '50% порог',
        data: Array(labels.length).fill(50),
        borderColor: 'rgba(250,204,21,0.4)', borderDash: [3, 3], borderWidth: 1, pointRadius: 0,
      },
    ],
  }), [results, theoretical, labels]);

  const theoryAtGroup = theoreticalBirthday(groupSize).toFixed(1);
  const simAtGroup    = results.length
    ? results[results.length - 1].experimental.toFixed(1)
    : null;

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Урок: Формула вероятности</div>
        <h2 className="exp-header__title">🎂 Парадокс дней рождения</h2>
        <p className="exp-header__sub">
          В группе из 23 человек вероятность совпадения дней рождения — больше 50%.
          Большинство людей думают, что нужно намного больше. Это парадокс!
        </p>
      </div>

      <div className="callout">
        P(совпадение) при n = <strong>23</strong> = <strong>{theoreticalBirthday(23).toFixed(1)}%</strong>.
        Граница 50% пересекается при <strong>n = {crossAt}</strong> человека.
        Формула: P = 1 − 365! / ((365−n)! · 365ⁿ)
      </div>

      <div className="controls">
        <div className="control-row">
          <span className="control-label">Размер группы</span>
          <input
            type="range" min="5" max="60" value={groupSize}
            onChange={e => { setGroupSize(+e.target.value); reset(); }}
          />
          <span className="control-value">{groupSize} чел.</span>
        </div>
        <div className="control-row">
          <span className="control-label">Симуляций на точку</span>
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
            {running ? <><span className="spinner" /> Считаем…</> : 'Симулировать'}
          </button>
          <button className="btn-ghost" onClick={reset} disabled={!results.length}>
            Сброс
          </button>
        </div>
      </div>

      {!results.length ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎂</div>
          <p>Выбери размер группы и нажми «Симулировать»</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">P при {groupSize} чел. (теория)</span>
              <span className="stat-chip__value">{theoryAtGroup}%</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Симуляция</span>
              <span className="stat-chip__value">{simAtGroup}%</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">50% при n =</span>
              <span className="stat-chip__value">{crossAt}</span>
            </div>
          </div>

          <div className="chart-box" style={{ height: 300 }}>
            <div className="chart-box__title">
              Вероятность совпадения дней рождения: группы 2–{groupSize} человек
            </div>
            <div style={{ height: 250 }}>
              <Line data={chartData} options={CHART_OPTS} />
            </div>
          </div>
        </>
      )}
    </>
  );
}