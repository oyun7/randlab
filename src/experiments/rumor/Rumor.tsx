import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { size: 12 } } },
  },
  scales: {
    x: {
      title: { display: true, text: 'Шаг', color: 'rgba(255,255,255,0.35)', font: { size: 11 } },
      ticks: { color: 'rgba(255,255,255,0.5)' },
      grid:  { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      min: 0,
      ticks: { color: 'rgba(255,255,255,0.5)' },
      grid:  { color: 'rgba(255,255,255,0.05)' },
    },
  },
} as const;

export function Rumor() {
  const [classSize, setClassSize] = useState(30);
  const [history,   setHistory]   = useState<number[]>([]);
  const [finalLayout, setFinalLayout] = useState<boolean[]>([]);
  const [running,   setRunning]   = useState(false);

  const reset = () => { setHistory([]); setFinalLayout([]); };

  const run = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      const knows = new Array(classSize).fill(false);
      // Один случайный ученик знает секрет
      knows[Math.floor(Math.random() * classSize)] = true;

      const hist: number[] = [1];
      let maxRounds = 25;

      while (knows.filter(Boolean).length < classSize && maxRounds-- > 0) {
        // Каждый «в теме» рассказывает одному случайному
        const infected = knows.reduce<number[]>((acc, k, i) => k ? [...acc, i] : acc, []);
        infected.forEach(() => {
          const teller = infected[Math.floor(Math.random() * infected.length)];
          const target = Math.floor(Math.random() * classSize);
          void teller; // teller выбирается случайно из infected
          knows[target] = true;
        });
        hist.push(knows.filter(Boolean).length);
      }

      setHistory(hist);
      setFinalLayout([...knows]);
      setRunning(false);
    }, 400);
  };

  const chartData = useMemo(() => ({
    labels: history.map((_, i) => `${i}`),
    datasets: [
      {
        label: 'Знают секрет',
        data: history,
        borderColor: '#f472b6',
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#f472b6',
        tension: 0.3,
        fill: true,
        backgroundColor: 'rgba(244,114,182,0.07)',
      },
      {
        label: `Весь класс (${classSize})`,
        data: Array(history.length).fill(classSize),
        borderColor: 'rgba(255,255,255,0.12)',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
      },
    ],
  }), [history, classSize]);

  const rounds      = history.length - 1;
  const finalCount  = history[history.length - 1] ?? 0;
  const allKnow     = finalCount === classSize;
  const after1Step  = history[1] ?? null;
  const after3Steps = history[3] ?? null;
  const halfPoint   = history.findIndex(v => v >= classSize / 2);

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Сложные и зависимые события</div>
        <h2 className="exp-header__title">📱 Как слух облетает класс</h2>
        <p className="exp-header__sub">
          Один человек знает секрет. Каждый шаг — все «в теме» рассказывают
          случайному однокласснику. Наблюдай за экспоненциальным ростом.
        </p>
      </div>

      <div className="controls">
        <div className="control-row">
          <span className="control-label">Размер класса</span>
          <input type="range" min="10" max="40" value={classSize}
            onChange={e => { setClassSize(+e.target.value); reset(); }} />
          <span className="control-value">{classSize} чел.</span>
        </div>
        <div className="control-btns">
          <button className="btn-primary" onClick={run} disabled={running}>
            {running ? <><span className="spinner" />Распространяем…</> : '📱 Пустить слух'}
          </button>
          <button className="btn-ghost" onClick={reset} disabled={!history.length}>Сброс</button>
        </div>
      </div>

      <div className="callout">
        <strong>Модель:</strong> каждый «в теме» за один шаг рассказывает одному случайному
        однокласснику. Уже знающие могут услышать снова — это нормально.
        На первых шагах число «в теме» <strong>примерно удваивается</strong> каждый раз,
        потом рост замедляется — класс насыщается.
      </div>

      {!history.length ? (
        <div className="empty-state">
          <div className="empty-state__icon">📱</div>
          <p>Нажми «Пустить слух» и наблюдай</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">Шагов всего</span>
              <span className="stat-chip__value">{rounds}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Узнали итого</span>
              <span className={`stat-chip__value ${allKnow ? 'ok' : ''}`}>
                {finalCount} / {classSize}
              </span>
            </div>
            {after1Step !== null && (
              <div className="stat-chip">
                <span className="stat-chip__label">После шага 1</span>
                <span className="stat-chip__value">{after1Step}</span>
              </div>
            )}
            {after3Steps !== null && (
              <div className="stat-chip">
                <span className="stat-chip__label">После шага 3</span>
                <span className="stat-chip__value">{after3Steps}</span>
              </div>
            )}
            {halfPoint >= 0 && (
              <div className="stat-chip">
                <span className="stat-chip__label">50% класса знают</span>
                <span className="stat-chip__value">шаг {halfPoint}</span>
              </div>
            )}
          </div>

          {/* Схема класса */}
          <div className="chart-box">
            <div className="chart-box__title">
              Кто знает после завершения — 🟣 знает / ⬜ не знает
            </div>
            <div className="rumor-grid">
              {finalLayout.map((knows, i) => (
                <div
                  key={i}
                  className={`rumor-student ${knows ? 'rumor-student--knows' : ''}`}
                  title={`Ученик ${i + 1}: ${knows ? 'знает' : 'не знает'}`}
                />
              ))}
            </div>
          </div>

          <div className="chart-box" style={{ height: 240 }}>
            <div className="chart-box__title">Распространение слуха по шагам</div>
            <div style={{ height: 190 }}>
              <Line data={chartData} options={{
                ...CHART_OPTS,
                scales: {
                  ...CHART_OPTS.scales,
                  y: { ...CHART_OPTS.scales.y, max: classSize },
                },
              }} />
            </div>
          </div>
        </>
      )}
    </>
  );
}