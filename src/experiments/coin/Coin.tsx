import { useState, useMemo, useCallback, useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useSimulation } from '../../hooks/useSimulation';

type CoinResult = 'Орёл' | 'Решка';

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

function clampCount(val: number, min: number, max: number, step: number = 1) {
  if (isNaN(val)) return min;
  // Округление до ближайшего step
  const rounded = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, rounded));
}

export function Coin() {
  const MIN = 1;
  const MAX = 100000;
  const STEP = 1;

  const [currentValue, setCurrentValue] = useState(100);
  const [inputValue, setInputValue]     = useState('100');
  const [bias, setBias]                 = useState(0.5);
  const [rotation, setRotation]         = useState(0);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generator = useCallback(
    (): CoinResult => (Math.random() < bias ? 'Орёл' : 'Решка'),
    [bias],
  );
  const { data, run, reset, isAnimating } = useSimulation<CoinResult>(generator);

  // Применить значение из поля ввода
  const applyInput = () => {
    const parsed = parseFloat(inputValue);
    const validated = clampCount(parsed, MIN, MAX, STEP);
    setCurrentValue(validated);
    setInputValue(String(validated));
  };

  // Изменить значение кнопками
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

  const flip = () => {
    const spins = 6 + Math.floor(Math.random() * 5);
    setRotation(r => r + spins * 360);
    run(currentValue);
  };

  const heads = data.filter(x => x === 'Орёл').length;
  const tails = data.length - heads;
  const freq  = data.length ? heads / data.length : 0;
  const delta = data.length ? ((freq - bias) * 100).toFixed(1) : null;

  const maxStreak = useMemo(() => {
    if (!data.length) return null;
    let max = 1, cur = 1, val = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i] === val) { cur++; if (cur > max) max = cur; }
      else { val = data[i]; cur = 1; }
    }
    return { count: max, value: val };
  }, [data]);

  const barData = useMemo(() => ({
    labels: ['Орёл', 'Решка'],
    datasets: [
      { label: 'Факт',   data: [heads, tails],
        backgroundColor: 'rgba(167,139,250,0.8)' },
      { label: 'Теория', data: [data.length * bias, data.length * (1 - bias)],
        backgroundColor: 'rgba(52,211,153,0.35)' },
    ],
  }), [heads, tails, data.length, bias]);

  const probabilities = useMemo(() => {
    let h = 0;
    return data.map((r, i) => { if (r === 'Орёл') h++; return h / (i + 1); });
  }, [data]);

  const lineData = useMemo(() => ({
    labels: data.map((_, i) => i + 1),
    datasets: [
      { label: 'Частота', data: probabilities,
        borderColor: '#38bdf8', tension: 0.3, pointRadius: 0, borderWidth: 2 },
      { label: 'Теория',  data: Array(data.length).fill(bias),
        borderColor: '#4ade80', borderDash: [6, 4], pointRadius: 0, borderWidth: 1.5 },
    ],
  }), [probabilities, data.length, bias]);

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Урок: Монетка и орёл</div>
        <h2 className="exp-header__title">🪙 Монетка</h2>
        <p className="exp-header__sub">
          Настрой вероятность орла, задай число бросков — и наблюдай, как частота
          стремится к теории при росте выборки. Закон больших чисел в действии.
        </p>
      </div>

      <div className="scene">
        <div
          className="coin"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transition: isAnimating
              ? 'transform 1.1s cubic-bezier(0.25,0.1,0.25,1)'
              : 'none',
          }}
        >
          <div className="coin__face">🪙</div>
          <div className="coin__face coin__face--back">🪙</div>
        </div>
      </div>

      <div className="controls">
        <div className="control-row">
          <span className="control-label">P(Орёл)</span>
          <input
            type="range" min="0" max="100" value={Math.round(bias * 100)}
            onChange={e => { setBias(+e.target.value / 100); reset(); }}
          />
          <span className="control-value">{(bias * 100).toFixed(0)}%</span>
        </div>
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
          <button className="btn-primary" onClick={flip} disabled={isAnimating}>
            {isAnimating
              ? <><span className="spinner" /> Бросаем…</>
              : 'Бросить монетку'}
          </button>
          <button className="btn-ghost" onClick={reset} disabled={!data.length}>
            Сброс
          </button>
        </div>
      </div>

      {!data.length ? (
        <div className="empty-state">
          <div className="empty-state__icon">🪙</div>
          <p>Нажми «Бросить монетку» — результаты появятся здесь</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">Всего бросков</span>
              <span className="stat-chip__value">{data.length}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Орёл</span>
              <span className="stat-chip__value">{heads}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Частота орла</span>
              <span className="stat-chip__value">{(freq * 100).toFixed(1)}%</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Откл. от теории</span>
              <span className={`stat-chip__value ${Math.abs(+delta!) > 3 ? 'bad' : 'ok'}`}>
                {delta}%
              </span>
            </div>
            {maxStreak && (
              <div className="stat-chip">
                <span className="stat-chip__label">Макс. стрик</span>
                <span className="stat-chip__value">
                  {maxStreak.count}× {maxStreak.value === 'Орёл' ? '🪙' : '⬜'}
                </span>
              </div>
            )}
          </div>

          <div className="callout">
            <strong>Закон больших чисел:</strong> при {data.length} бросках
            частота орла = <strong>{(freq * 100).toFixed(2)}%</strong>,
            теория даёт <strong>{(bias * 100).toFixed(0)}%</strong>.
            {data.length < 100
              ? ' Попробуй добавить ещё — разброс уменьшится.'
              : ' Кривая уже почти касается теоретической линии!'}
          </div>

          <div className="chart-box" style={{ height: 240 }}>
            <div className="chart-box__title">Сравнение: факт vs теория</div>
            <div style={{ height: 190 }}>
              <Bar data={barData} options={CHART_OPTS} />
            </div>
          </div>

          <div className="chart-box" style={{ height: 240 }}>
            <div className="chart-box__title">Сходимость частоты</div>
            <div style={{ height: 190 }}>
              <Line data={lineData} options={{ ...CHART_OPTS, animation: false }} />
            </div>
          </div>
        </>
      )}
    </>
  );
}