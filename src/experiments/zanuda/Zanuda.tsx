import { useState, useMemo, useRef } from 'react';

const ROWS = 5;
const COLS = 3;
const TOTAL = ROWS * COLS * 2; // 30 мест

function getSeatId(row: number, col: number, side: number) {
  return row * 6 + col * 2 + side;
}
function getSeatInfo(id: number) {
  return {
    row:  Math.floor(id / 6),
    col:  Math.floor((id % 6) / 2),
    side: id % 2,
  };
}

// Соседи по правилу пользователя:
// - напарник (другое место той же парты)
// - оба места спереди (row-1, тот же col)
// - оба места сзади  (row+1, тот же col)
// - если правое место → левое место правой парты  (row, col+1, side=0)
// - если левое место  → правое место левой парты  (row, col-1, side=1)
function getNeighbors(id: number): Set<number> {
  const { row, col, side } = getSeatInfo(id);
  const n = new Set<number>();

  // Напарник
  n.add(getSeatId(row, col, 1 - side));

  // Спереди — оба
  if (row > 0) {
    n.add(getSeatId(row - 1, col, 0));
    n.add(getSeatId(row - 1, col, 1));
  }
  // Сзади — оба
  if (row < ROWS - 1) {
    n.add(getSeatId(row + 1, col, 0));
    n.add(getSeatId(row + 1, col, 1));
  }
  // Справа (только ближайшее место соседней парты)
  if (side === 1 && col < COLS - 1) n.add(getSeatId(row, col + 1, 0));
  // Слева
  if (side === 0 && col > 0)        n.add(getSeatId(row, col - 1, 1));

  return n;
}

type SeatRole = 'user' | 'zanuda' | 'neighbor' | 'normal';

interface SimResult {
  probability: number;
  hits:        number;
  sampleZanudy: number[];
}

function clampCount(val: number, min: number, max: number, step: number = 1) {
  if (isNaN(val)) return min;
  const rounded = Math.round(val / step) * step;
  return Math.max(min, Math.min(max, rounded));
}

export function Zanuda() {
  const MIN = 1;
  const MAX = 100000;
  const STEP = 10;

  const [selected, setSelected]         = useState<number | null>(null);
  const [zanudaCount, setZanudaCount]   = useState(1);
  const [currentValue, setCurrentValue] = useState(200);
  const [inputValue, setInputValue]     = useState('200');
  const [result, setResult]             = useState<SimResult | null>(null);
  const [running, setRunning]           = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const neighbors = useMemo(
    () => selected !== null ? getNeighbors(selected) : new Set<number>(),
    [selected],
  );

  const { row: selRow, col: selCol, side: selSide } =
    selected !== null ? getSeatInfo(selected) : { row: -1, col: -1, side: -1 };

  const run = () => {
    if (selected === null) return;
    setRunning(true);

    setTimeout(() => {
      const others = Array.from({ length: TOTAL }, (_, i) => i).filter(i => i !== selected);
      let hits = 0;
      let lastZanudy: number[] = [];

      for (let s = 0; s < currentValue; s++) {
        const shuffled = [...others].sort(() => Math.random() - 0.5);
        const zanudy   = shuffled.slice(0, zanudaCount);
        if (s === currentValue - 1) lastZanudy = zanudy;
        if (zanudy.some(z => neighbors.has(z))) hits++;
      }

      setResult({ probability: hits / currentValue, hits, sampleZanudy: lastZanudy });
      setRunning(false);
    }, 500);
  };

  const reset = () => { setResult(null); setSelected(null); };

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

  const getSeatRole = (id: number): SeatRole => {
    if (id === selected)                           return 'user';
    if (result?.sampleZanudy.includes(id))         return 'zanuda';
    if (neighbors.has(id))                         return 'neighbor';
    return 'normal';
  };

  const zanudaNearby = result
    ? result.sampleZanudy.some(z => neighbors.has(z))
    : false;

  // Теоретическая вероятность: гипергеометрическое распределение
  // P(хотя бы 1 из zanudaCount попал в neighbors.size из 29 оставшихся)
  const theoreticalP = useMemo(() => {
    if (selected === null) return null;
    const N = TOTAL - 1;       // оставшихся мест
    const K = neighbors.size;  // мест-соседей
    const n = zanudaCount;     // зануд
    // P(0 зануд среди соседей) = C(K,0)*C(N-K,n) / C(N,n)
    // Используем логарифмы для устойчивости
    function logC(a: number, b: number): number {
      if (b < 0 || b > a) return -Infinity;
      let r = 0;
      for (let i = 0; i < b; i++) r += Math.log(a - i) - Math.log(i + 1);
      return r;
    }
    const p0 = Math.exp(logC(N - K, n) - logC(N, n));
    return Math.max(0, Math.min(1, 1 - p0));
  }, [selected, neighbors, zanudaCount]);

  return (
    <>
      <div className="exp-header">
        <div className="exp-header__lesson-link">📖 Комбинаторика и вероятность</div>
        <h2 className="exp-header__title">🏫 Зануда за партой</h2>
        <p className="exp-header__sub">
          Выбери своё место, укажи количество зануд в классе — и узнай,
          с какой вероятностью один из них окажется твоим соседом.
        </p>
      </div>

      {/* ── ШАГ 1: выбор места ── */}
      <div className="controls">
        <div className="z-step-label">
          Шаг 1 — кликни на своё место
          {selected !== null && (
            <span className="z-step-chosen">
              ✓ Ряд {selRow + 1}, Колонка {selCol + 1}, {selSide === 0 ? 'левое' : 'правое'}
            </span>
          )}
        </div>

        <div className="classroom">
          <div className="classroom__board">📋 Доска</div>
          <div className="classroom__grid">
            {Array.from({ length: ROWS }, (_, row) => (
              <div key={row} className="classroom__row">
                <span className="classroom__row-num">{row + 1}</span>
                {Array.from({ length: COLS }, (_, col) => (
                  <div key={col} className="classroom__desk">
                    {[0, 1].map(side => {
                      const id   = getSeatId(row, col, side);
                      const role = getSeatRole(id);
                      return (
                        <button
                          key={side}
                          className={`seat seat--${role}`}
                          onClick={() => { setSelected(id); setResult(null); }}
                          title={`Ряд ${row + 1}, Кол ${col + 1}, ${side === 0 ? 'Лев' : 'Пр'}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Легенда */}
        <div className="seat-legend">
          {([
            ['user',     'Ты'],
            ['neighbor', 'Соседи'],
            ['zanuda',   'Зануда'],
            ['normal',   'Все остальные'],
          ] as [SeatRole, string][]).map(([role, label]) => (
            <div key={role} className="seat-legend__item">
              <div className={`seat seat--${role} seat--mini`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ШАГ 2: настройки ── */}
      {selected !== null && (
        <div className="controls">
          <div className="z-step-label">Шаг 2 — настрой параметры</div>

          <div className="control-row">
            <span className="control-label">Зануд в классе</span>
            <input
              type="range" min="1" max={Math.min(15, TOTAL - 1)} value={zanudaCount}
              onChange={e => { setZanudaCount(+e.target.value); setResult(null); }}
            />
            <span className="control-value">{zanudaCount}</span>
          </div>

          <div className="control-row">
            <span className="control-label">Число симуляций</span>
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
              {running ? <><span className="spinner" /> Рассаживаем…</> : '🎲 Запустить'}
            </button>
            <button className="btn-ghost" onClick={reset}>
              Сначала
            </button>
          </div>
        </div>
      )}

      {/* ── РЕЗУЛЬТАТ ── */}
      {result && selected !== null && (
        <>
          <div className="stats-grid">
            <div className="stat-chip">
              <span className="stat-chip__label">Вероятность (симуляция)</span>
              <span className={`stat-chip__value ${result.probability > 0.6 ? 'bad' : result.probability > 0.3 ? '' : 'ok'}`}>
                {(result.probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Вероятность (теория)</span>
              <span className="stat-chip__value">
                {theoreticalP !== null ? (theoreticalP * 100).toFixed(1) + '%' : '—'}
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Раз рядом / всего</span>
              <span className="stat-chip__value">{result.hits} / {currentValue}</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip__label">Соседних мест</span>
              <span className="stat-chip__value">{neighbors.size} из 29</span>
            </div>
          </div>

          <div className="callout" style={{
            borderLeftColor: zanudaNearby ? '#f87171' : '#4ade80',
          }}>
            <strong>Последняя рассадка (показана выше):</strong>{' '}
            {zanudaNearby
              ? '😬 Зануда оказался рядом!'
              : '😌 Повезло — зануды рядом нет.'}
            {' '}По {currentValue} симуляциям вероятность нарваться на соседа-зануду = {' '}
            <strong>{(result.probability * 100).toFixed(1)}%</strong>.
            {theoreticalP !== null && (
              <> Теоретически (гипергеометрическое распределение): <strong>{(theoreticalP * 100).toFixed(1)}%</strong>.</>
            )}
          </div>
        </>
      )}

      {selected === null && (
        <div className="empty-state">
          <div className="empty-state__icon">🏫</div>
          <p>Кликни на любое место в схеме класса</p>
        </div>
      )}
    </>
  );
}