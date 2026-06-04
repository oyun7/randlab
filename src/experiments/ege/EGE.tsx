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

function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 0; i < k; i++) c *= (n - i) / (i + 1);
  return c;
}

function clampCount(val: number, min: number, max: number, step: number = 1) {
  if (isNaN(val)) return min;
  const rounded = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, rounded));
}

export function EGE() {
  const MIN = 100;
  const MAX = 100000;
  const STEP = 10;

  const [questions, setQuestions]       = useState(20);
  const [choices, setChoices]           = useState(4);
  const [currentValue, setCurrentValue] = useState(500);
  const [inputValue, setInputValue]     = useState('500');
  const [passMark, setPassMark]         = useState(50);
  const [results, setResults]           = useState<number[]>([]);
  const [running, setRunning]           = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const p = 1 / choices;
  const theorMean = questions * p;
  const theorSD   = Math.sqrt(questions * p * (1 - p));
  const passThreshold = Math.round(questions * passMark / 100);

  const run = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      const arr: number[] = [];
      for (let s = 0; s < currentValue; s++) {
        let correct = 0;
        for (let q = 0; q < questions; q++) {
          if (Math.random() < p) correct++;
        }
        arr.push(correct);
      }
      setResults(arr);
      setRunning(false);
    }, 400);
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

  const freqs = useMemo(() => {
    const f = Array(questions + 1).fill(0);
    results.forEach(r => f[r]++);
    return f;
  }, [results, questions]);

  const theorFreqs = useMemo(
    () => Array.from({ length: questions + 1 }, (_, k) =>
      currentValue * binom(questions, k) * p ** k * (1 - p) ** (questions - k),
    ),
    [questions, p, currentValue],
  );

  const mean      = results.length ? results.reduce((a, b) => a + b, 0) / results.length : null;
  const passCount = results.filter(r => r >= passThreshold).length;
  const passRate  = results.length ? passCount / results.length : null;

  const chartData = useMemo(() => ({
    labels: Array.from({ length: questions + 1 }, (_, i) => String(i)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Симуляция',
        data: freqs,
        backgroundColor: freqs.map((_, i) =>
          i >= passThreshold ? 'rgba(52,211,153,0.7)' : 'rgba(167,139,250,0.55)',
        ),
        borderWidth: 0,
      },
      {
        type: 'line' as const,
        label: 'Теория (биномиальное)',
        data: theorFreqs,
        borderColor: '#38bdf8',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  }), [freqs, theorFreqs, passThreshold, questions]);

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Урок: Формула вероятности</div>
        <h2 className="exp-header__title">📝 ЕГЭ на удачу</h2>
        <p className="exp-header__sub">
          Что если отвечать случайно на все вопросы? Биномиальное распределение
          показывает, сколько правильных ответов можно ожидать при чистом угадывании.
        </p>
      </div>

      <div className="controls">
        <div className="control-row">
          <span className="control-label">Вопросов в тесте</span>
          <input type="range" min="5" max="30" value={questions}
            onChange={e => { setQuestions(+e.target.value); reset(); }} />
          <span className="control-value">{questions}</span>
        </div>
        <div className="control-row">
          <span className="control-label">Вариантов ответа</span>
          <input type="range" min="2" max="5" value={choices}
            onChange={e => { setChoices(+e.target.value); reset(); }} />
          <span className="control-value">{choices}</span>
        </div>
        <div className="control-row">
          <span className="control-label">Порог сдачи</span>
          <input type="range" min="10" max="80" step="5" value={passMark}
            onChange={e => { setPassMark(+e.target.value); reset(); }} />
          <span className="control-value">{passMark}%</span>
        </div>
        <div className="control-row">
          <span className="control-label">Симуляций</span>
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
            {running ? <><span className="spinner" />Сдаём…</> : '📝 Угадывать!'}
          </button>
          <button className="btn-ghost" onClick={reset} disabled={!results.length}>Сброс</button>
        </div>
      </div>

      <div className="callout">
        При {questions} вопросах и {choices} вариантах: P(угадать 1) = 1/{choices} = <strong>{(p * 100).toFixed(1)}%</strong>.
        Ожидаемый результат: <strong>{theorMean.toFixed(1)} из {questions}</strong> ({(theorMean / questions * 100).toFixed(1)}%).
        Стандартное отклонение: <strong>σ = {theorSD.toFixed(2)}</strong>.
        Порог сдачи: <strong>{passThreshold} правильных</strong>.
      </div>

      {!results.length ? (
        <div className="empty-state">
          <div className="empty-state__icon">📝</div>
          <p>Настрой параметры и нажми «Угадывать!»</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">Среднее (факт)</span>
              <span className="stat-chip__value">{mean?.toFixed(1)}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Среднее (теория)</span>
              <span className="stat-chip__value">{theorMean.toFixed(1)}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Сдали тест</span>
              <span className={`stat-chip__value ${(passRate ?? 0) < 0.2 ? 'ok' : 'bad'}`}>
                {(passRate! * 100).toFixed(1)}%
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Из симуляций</span>
              <span className="stat-chip__value">{passCount} / {currentValue}</span>
            </div>
          </div>

          <div className="chart-box" style={{ height: 290 }}>
            <div className="chart-box__title">
              Распределение баллов — 🟢 сдал ({passThreshold}+) / 🟣 не сдал
            </div>
            <div style={{ height: 240 }}>
              <Bar data={chartData as any} options={CHART_OPTS} />
            </div>
          </div>
        </>
      )}
    </>
  );
}