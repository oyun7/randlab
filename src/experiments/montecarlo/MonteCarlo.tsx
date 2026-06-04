import { useState, useRef, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { size: 12 } } },
  },
  scales: {
    x: {
      ticks: { color: 'rgba(255,255,255,0.5)', maxTicksLimit: 8 },
      grid:  { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      min: 2.5, max: 3.8,
      ticks: { color: 'rgba(255,255,255,0.5)' },
      grid:  { color: 'rgba(255,255,255,0.05)' },
    },
  },
} as const;

const CANVAS_SIZE    = 280;
const DOT_RADIUS     = 1.5;
const MAX_CANVAS_DOTS = 4000;

type Dot = { x: number; y: number; inside: boolean };

export function MonteCarlo() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const dotsRef      = useRef<Dot[]>([]);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [inside,    setInside]    = useState(0);
  const [total,     setTotal]     = useState(0);
  const [running,   setRunning]   = useState(false);
  const [piHistory, setPiHistory] = useState<number[]>([]);

  const drawCanvas = useCallback((dots: Dot[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s   = CANVAS_SIZE;

    ctx.fillStyle = '#13131f';
    ctx.fillRect(0, 0, s, s);

    // Круг
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(167,139,250,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(167,139,250,0.5)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Точки
    const visible = dots.slice(-MAX_CANVAS_DOTS);
    for (const d of visible) {
      ctx.beginPath();
      ctx.arc(d.x * s, d.y * s, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = d.inside
        ? 'rgba(52,211,153,0.7)'
        : 'rgba(248,113,113,0.5)';
      ctx.fill();
    }
  }, []);

  const addBatch = useCallback((batchSize: number) => {
    const newDots: Dot[] = [];
    let newInside = 0;

    for (let i = 0; i < batchSize; i++) {
      const x      = Math.random();
      const y      = Math.random();
      const inside = (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25;
      newDots.push({ x, y, inside });
      if (inside) newInside++;
    }

    dotsRef.current = [...dotsRef.current, ...newDots];
    drawCanvas(dotsRef.current);

    setInside(prevIn => {
      const nextInside = prevIn + newInside;
      setTotal(prevTotal => {
        const nextTotal = prevTotal + batchSize;
        const pi = (4 * nextInside) / nextTotal;
        setPiHistory(h => [...h.slice(-200), pi]);
        return nextTotal;
      });
      return nextInside;
    });
  }, [drawCanvas]);

  const start = () => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => addBatch(50), 60);
  };

  const pause = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const reset = () => {
    pause();
    dotsRef.current = [];
    setInside(0);
    setTotal(0);
    setPiHistory([]);
    setRunning(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#13131f';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
  };

  // Первоначальная отрисовка пустого канваса
  useEffect(() => { drawCanvas([]); }, [drawCanvas]);

  // Cleanup
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const pi  = total ? (4 * inside) / total : 0;
  const err = total ? Math.abs(pi - Math.PI).toFixed(5) : null;

  const chartData = {
    labels: piHistory.map((_, i) => String((i + 1) * 50)),
    datasets: [
      {
        label: 'Оценка π',
        data: piHistory,
        borderColor: '#fb923c', borderWidth: 2, pointRadius: 0, tension: 0.3,
      },
      {
        label: 'π настоящее',
        data: Array(piHistory.length).fill(Math.PI),
        borderColor: 'rgba(167,139,250,0.6)',
        borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0,
      },
    ],
  };

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Урок: Формула вероятности</div>
        <h2 className="exp-header__title">🎯 Метод Монте-Карло: число π</h2>
        <p className="exp-header__sub">
          Бросаем случайные точки в квадрат 1×1. Доля попавших в вписанную окружность ≈ π/4.
          Чем больше точек — тем точнее оценка. Точность растёт как 1/√N.
        </p>
      </div>

      <div className="callout">
        <strong>Идея:</strong> площадь круга r=0.5 = π/4. Площадь квадрата = 1.
        Значит P(попасть в круг) = π/4. Оцениваем частотой → π ≈ 4 · (внутри / всего).
        Зелёные точки — внутри круга, красные — снаружи.
      </div>

      <div className="mc-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="mc-canvas"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
        />
      </div>

      <div className="controls">
        <div className="control-btns">
          {!running ? (
            <button className="btn-primary" onClick={start}>
              {total === 0 ? '▶ Старт' : '▶ Продолжить'}
            </button>
          ) : (
            <button className="btn-primary" onClick={pause}>
              ⏸ Пауза
            </button>
          )}
          <button className="btn-ghost" onClick={reset} disabled={total === 0 && !running}>
            Сброс
          </button>
        </div>
      </div>

      {total > 0 && (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">Точек всего</span>
              <span className="stat-chip__value">{total.toLocaleString()}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">В круге</span>
              <span className="stat-chip__value">{inside.toLocaleString()}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Оценка π</span>
              <span className={`stat-chip__value ${Math.abs(pi - Math.PI) < 0.01 ? 'ok' : ''}`}>
                {pi.toFixed(5)}
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Погрешность</span>
              <span className="stat-chip__value">{err}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">π настоящее</span>
              <span className="stat-chip__value">3.14159…</span>
            </div>
          </div>

          {piHistory.length > 5 && (
            <div className="chart-box" style={{ height: 220 }}>
              <div className="chart-box__title">Сходимость оценки π</div>
              <div style={{ height: 170 }}>
                <Line data={chartData} options={CHART_OPTS} />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}